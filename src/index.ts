import { QUESTIONS, type QuestionKind, type StudyQuestion } from "./questions";
import {
  getAttempts,
  getDailySubscriptionStatus,
  getDailySubscriptions,
  getRecentlyServedQuestionIds,
  getReviewQuestionIds,
  loadQuizSession,
  recordGrade,
  removeFromReviewQueue,
  saveQuizSession,
  setDailySubscription,
  type AttemptRecord
} from "./storage";

export interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;
  DB?: D1Database;
}

interface SlackEventPayload {
  type: string;
  challenge?: string;
  event?: {
    type?: string;
    subtype?: string;
    bot_id?: string;
    channel?: string;
    text?: string;
    ts?: string;
    thread_ts?: string;
    user?: string;
  };
}

interface SlackThreadMessage {
  text?: string;
}

type StudyMode =
  | "mixed"
  | "practical"
  | "concept"
  | "choice"
  | "mock"
  | "frequent"
  | "terms"
  | "calculation"
  | "advanced"
  | "daily";
type StudyTopic =
  | "all"
  | "code"
  | "c"
  | "java"
  | "python"
  | "sql"
  | "database"
  | "security"
  | "network"
  | "os"
  | "test"
  | "software"
  | "algorithm"
  | "data_structure"
  | "linux"
  | "web"
  | "api"
  | "emerging";

interface QuizCommand {
  type: "quiz";
  count: number;
  mode: StudyMode;
  topic: StudyTopic;
  label?: string;
}

interface RevealCommand {
  type: "reveal";
  action: "answer" | "hint" | "explain";
  target: "all" | number;
}

interface HelpCommand {
  type: "help";
}

interface SubjectsCommand {
  type: "subjects";
}

interface GradeCommand {
  type: "grade";
  target: number;
  isCorrect: boolean;
}

interface ReviewCommand {
  type: "review";
  count: number;
  weakFirst: boolean;
}

interface RemoveReviewCommand {
  type: "remove-review";
  target: number;
}

interface StatsCommand {
  type: "stats";
  todayOnly: boolean;
}

interface DailySubscriptionCommand {
  type: "daily-subscription";
  action: "enable" | "disable" | "status";
  count: number;
}

type Command =
  | QuizCommand
  | RevealCommand
  | HelpCommand
  | SubjectsCommand
  | GradeCommand
  | ReviewCommand
  | RemoveReviewCommand
  | StatsCommand
  | DailySubscriptionCommand
  | null;

interface SetDescriptor {
  seed: number;
  count: number;
  mode: StudyMode;
  topic: StudyTopic;
}

const KIND_LABELS: Record<QuestionKind, string> = {
  code: "코드",
  sql: "SQL",
  concept: "단답",
  choice: "보기"
};

const TOPIC_TAGS: Record<Exclude<StudyTopic, "all">, string[]> = {
  code: ["code"],
  c: ["c"],
  java: ["java"],
  python: ["python"],
  sql: ["sql"],
  database: ["database", "db"],
  security: ["security", "보안"],
  network: ["network", "네트워크"],
  os: ["os", "운영체제", "스케줄링"],
  test: ["test", "테스트"],
  software: ["software", "설계", "uml"],
  algorithm: ["algorithm", "알고리즘"],
  data_structure: ["data-structure", "자료구조"],
  linux: ["linux", "리눅스"],
  web: ["web", "웹", "http"],
  api: ["api", "interface", "rest"],
  emerging: ["emerging", "신기술"]
};

const TOPIC_LABELS: Record<StudyTopic, string> = {
  all: "종합",
  code: "코드",
  c: "C언어",
  java: "Java",
  python: "Python",
  sql: "SQL",
  database: "데이터베이스",
  security: "보안",
  network: "네트워크",
  os: "운영체제",
  test: "애플리케이션 테스트",
  software: "소프트웨어 설계",
  algorithm: "알고리즘",
  data_structure: "자료구조",
  linux: "리눅스",
  web: "웹",
  api: "API",
  emerging: "신기술"
};

const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const isLocalRequest = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "study-hub-bot",
        version: "4.0.0",
        message: "공부봇이 실행 중입니다.",
        ...(isLocalRequest ? { localTest: "/test/command?text=문제줘" } : {})
      });
    }

    if (request.method === "GET" && url.pathname === "/test/command") {
      if (!isLocalRequest) {
        return new Response("Not Found", { status: 404 });
      }

      const input = url.searchParams.get("text")?.trim() || "문제줘";
      const command = parseCommand(input);

      if (!command) {
        return textResponse(
          "인식하지 못한 명령어입니다. `도움말`을 입력해 사용 가능한 명령을 확인하세요.",
          400
        );
      }

      if (command.type === "help") {
        return textResponse(buildHelpMessage());
      }

      if (command.type === "subjects") {
        return textResponse(buildSubjectsMessage());
      }

      if (command.type === "reveal") {
        return textResponse("정답·힌트·해설은 Slack 문제 스레드 안에서 요청하세요.", 400);
      }

      if (command.type !== "quiz") {
        return textResponse("학습 기록 명령은 Slack과 D1이 연결된 환경에서 사용하세요.", 400);
      }

      return textResponse(buildQuizMessage(createDescriptor(command)));
    }

    if (request.method !== "POST" || url.pathname !== "/slack/events") {
      return new Response("Not Found", { status: 404 });
    }

    const rawBody = await request.text();
    const isValid = await verifySlackSignature(request, rawBody, env.SLACK_SIGNING_SECRET);

    if (!isValid) {
      return new Response("Invalid Slack signature", { status: 401 });
    }

    let payload: SlackEventPayload;

    try {
      payload = JSON.parse(rawBody) as SlackEventPayload;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (payload.type === "url_verification" && payload.challenge) {
      return Response.json({ challenge: payload.challenge });
    }

    if (payload.type === "event_callback") {
      ctx.waitUntil(handleSlackEvent(payload, env));
    }

    return new Response("ok");
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.DB) return;
    const db = env.DB;

    const subscriptions = await getDailySubscriptions(db);
    const jobs = subscriptions.map(async (subscription) => {
      const command: QuizCommand = {
        type: "quiz",
        count: subscription.questionCount,
        mode: "daily",
        topic: "all"
      };
      const message = await buildTrackedQuizMessage(
        command,
        subscription.userId,
        subscription.channelId,
        db
      );
      await postSlackMessage(env.SLACK_BOT_TOKEN, subscription.channelId, message);
    });

    ctx.waitUntil(Promise.all(jobs).then(() => undefined));
  }
} satisfies ExportedHandler<Env>;

async function handleSlackEvent(payload: SlackEventPayload, env: Env): Promise<void> {
  const event = payload.event;

  if (
    !event ||
    event.type !== "message" ||
    event.subtype ||
    event.bot_id ||
    !event.channel ||
    !event.text ||
    !event.ts
  ) {
    return;
  }

  if (event.channel !== env.SLACK_CHANNEL_ID) {
    return;
  }

  const command = parseCommand(event.text);

  if (!command) {
    return;
  }

  const threadTs = event.thread_ts ?? event.ts;
  const userId = event.user ?? "unknown";
  let message: string;

  if (command.type === "help") {
    message = buildHelpMessage();
  } else if (command.type === "subjects") {
    message = buildSubjectsMessage();
  } else if (command.type === "quiz") {
    message = env.DB
      ? await buildTrackedQuizMessage(command, userId, event.channel, env.DB)
      : buildQuizMessage(createDescriptor(command));
  } else if (command.type === "review") {
    message = await buildReviewMessage(command, userId, event.channel, env.DB);
  } else if (command.type === "remove-review") {
    message = await buildRemoveReviewMessage(command, userId, event.channel, event.thread_ts, env);
  } else if (command.type === "grade") {
    message = await buildGradeMessage(command, userId, event.channel, event.thread_ts, env);
  } else if (command.type === "stats") {
    message = await buildStatsMessage(userId, env.DB, command.todayOnly);
  } else if (command.type === "daily-subscription") {
    message = await buildDailySubscriptionMessage(command, userId, event.channel, env.DB);
  } else {
    message = await buildRevealMessage(command, event.channel, event.thread_ts, env);
  }

  await postSlackMessage(env.SLACK_BOT_TOKEN, event.channel, message, threadTs);
}

export function parseCommand(input: string): Command {
  const text = input
    .replace(/<@[^>]+>/g, "")
    .trim()
    .replace(/\s*(줘|주세요)\s*$/, "")
    .trim();

  if (/^(도움말|명령어|사용법)$/.test(text)) {
    return { type: "help" };
  }

  if (/^(과목|과목표|분야)$/.test(text)) {
    return { type: "subjects" };
  }

  const removeReviewMatch = text.match(/^(\d+)\s*번\s*(오답\s*해제|오답\s*삭제|복습\s*해제)$/);
  if (removeReviewMatch) {
    return { type: "remove-review", target: Number(removeReviewMatch[1]) };
  }

  const gradeMatch = text.match(/^(\d+)\s*번\s*(맞음|맞았어|맞았습니다|틀림|틀렸어|틀렸습니다)$/);
  if (gradeMatch) {
    return {
      type: "grade",
      target: Number(gradeMatch[1]),
      isCorrect: /^(맞음|맞았어|맞았습니다)$/.test(gradeMatch[2])
    };
  }

  const reviewMatch = text.match(/^(오답|복습|취약)(?:\s*문제)?(?:\s*(\d+)\s*개)?$/);
  if (reviewMatch) {
    return {
      type: "review",
      count: clampQuestionCount(reviewMatch[2] ? Number(reviewMatch[2]) : 5),
      weakFirst: reviewMatch[1] === "취약"
    };
  }

  if (/^(통계|학습\s*통계|내\s*통계)$/.test(text)) {
    return { type: "stats", todayOnly: false };
  }

  if (/^(오늘\s*기록|오늘\s*통계)$/.test(text)) {
    return { type: "stats", todayOnly: true };
  }

  if (/^(자동\s*출제|매일\s*문제|알림)\s*(확인|상태)$/.test(text)) {
    return { type: "daily-subscription", action: "status", count: 5 };
  }

  const dailySubscriptionMatch = text.match(/^매일(?:\s*오전\s*9시)?(?:\s*문제)?(?:\s*(\d+)\s*개)?\s*(켜기|끄기)$/);
  if (dailySubscriptionMatch) {
    return {
      type: "daily-subscription",
      action: dailySubscriptionMatch[2] === "켜기" ? "enable" : "disable",
      count: clampQuestionCount(dailySubscriptionMatch[1] ? Number(dailySubscriptionMatch[1]) : 5)
    };
  }

  const noRepeatMatch = text.match(/^중복\s*없이\s*문제(?:\s*(\d+)\s*개)?$/);
  if (noRepeatMatch) {
    return {
      type: "quiz",
      count: clampQuestionCount(noRepeatMatch[1] ? Number(noRepeatMatch[1]) : 10),
      mode: "mixed",
      topic: "all",
      label: "중복 없는"
    };
  }

  const numberedReveal = text.match(/^(\d+)\s*번\s*(정답|힌트|해설|풀이)$/);

  if (numberedReveal) {
    const actionMap = { 정답: "answer", 힌트: "hint", 해설: "explain", 풀이: "explain" } as const;
    return {
      type: "reveal",
      action: actionMap[numberedReveal[2] as keyof typeof actionMap],
      target: Number(numberedReveal[1])
    };
  }

  if (/^(정답|정답줘|전체\s*정답)$/.test(text)) {
    return { type: "reveal", action: "answer", target: "all" };
  }

  if (/^(해설|해설줘|풀이|풀이줘|전체\s*(해설|풀이))$/.test(text)) {
    return { type: "reveal", action: "explain", target: "all" };
  }

  const mockMatch = text.match(/^모의고사(?:\s*(\d+)\s*개)?$/);
  if (mockMatch) {
    return { type: "quiz", count: clampQuestionCount(mockMatch[1] ? Number(mockMatch[1]) : 20), mode: "mock", topic: "all" };
  }

  if (/^오늘\s*(문제)?$/.test(text)) {
    return { type: "quiz", count: 10, mode: "daily", topic: "all" };
  }

  if (/^문제\s*줘?$/.test(text)) {
    return { type: "quiz", count: 10, mode: "mixed", topic: "all" };
  }

  const countMatch = text.match(/^문제\s*(\d+)\s*개(?:\s*줘)?$/);

  if (countMatch) {
    return {
      type: "quiz",
      count: clampQuestionCount(Number(countMatch[1])),
      mode: "mixed",
      topic: "all"
    };
  }

  const topicMatch = text.match(/^(.+?)\s*문제(?:\s*(\d+)\s*개)?(?:\s*줘)?$/);

  if (topicMatch) {
    const normalized = normalizeTopic(topicMatch[1]);
    if (!normalized) return null;
    return {
      type: "quiz",
      count: clampQuestionCount(topicMatch[2] ? Number(topicMatch[2]) : 10),
      ...normalized
    };
  }

  const shortMatch = text.match(/^(.+?)(?:\s*(\d+)\s*개)?$/);
  if (shortMatch) {
    const normalized = normalizeTopic(shortMatch[1]);
    if (!normalized) return null;
    return {
      type: "quiz",
      count: clampQuestionCount(shortMatch[2] ? Number(shortMatch[2]) : 10),
      ...normalized
    };
  }

  return null;
}

function normalizeTopic(raw: string): Pick<QuizCommand, "mode" | "topic" | "label"> | null {
  const value = raw.trim().toLowerCase().replace(/\s+/g, "");

  if (["종합", "랜덤", "혼합"].includes(value)) {
    return { mode: "mixed", topic: "all", label: raw.trim() };
  }
  if (["실전", "실기"].includes(value)) {
    return { mode: "practical", topic: "all", label: raw.trim() };
  }
  if (["개념", "이론", "복습"].includes(value)) {
    return { mode: "concept", topic: "all", label: raw.trim() };
  }
  if (["보기", "선택", "객관식"].includes(value)) {
    return { mode: "choice", topic: "all", label: raw.trim() };
  }
  if (["빈출", "자주나오는"].includes(value)) {
    return { mode: "frequent", topic: "all", label: "빈출" };
  }
  if (["용어", "단답", "단답형"].includes(value)) {
    return { mode: "terms", topic: "all", label: "용어" };
  }
  if (["계산", "계산형"].includes(value)) {
    return { mode: "calculation", topic: "all", label: "계산" };
  }
  if (["심화", "고난도", "어려운"].includes(value)) {
    return { mode: "advanced", topic: "all", label: "심화" };
  }
  if (["코드", "코딩", "프로그래밍"].includes(value)) {
    return { mode: "practical", topic: "code", label: raw.trim() };
  }
  if (["c", "c언어"].includes(value)) {
    return { mode: "practical", topic: "c", label: "C언어" };
  }
  if (["java", "자바"].includes(value)) {
    return { mode: "practical", topic: "java", label: "Java" };
  }
  if (["python", "파이썬"].includes(value)) {
    return { mode: "practical", topic: "python", label: "Python" };
  }
  if (value === "sql") {
    return { mode: "practical", topic: "sql", label: "SQL" };
  }
  if (["db", "데이터베이스", "정규화"].includes(value)) {
    return { mode: "mixed", topic: "database", label: raw.trim() };
  }
  if (["보안", "시큐리티"].includes(value)) {
    return { mode: "mixed", topic: "security", label: raw.trim() };
  }
  if (["네트워크", "통신"].includes(value)) {
    return { mode: "mixed", topic: "network", label: raw.trim() };
  }
  if (["운영체제", "os", "스케줄링"].includes(value)) {
    return { mode: "mixed", topic: "os", label: raw.trim() };
  }
  if (["테스트", "애플리케이션테스트"].includes(value)) {
    return { mode: "mixed", topic: "test", label: raw.trim() };
  }
  if (["소프트웨어공학", "설계", "uml", "디자인패턴"].includes(value)) {
    return { mode: "mixed", topic: "software", label: raw.trim() };
  }
  if (["알고리즘", "알고리듬"].includes(value)) {
    return { mode: "mixed", topic: "algorithm", label: "알고리즘" };
  }
  if (["자료구조", "자료 구조"].includes(value)) {
    return { mode: "mixed", topic: "data_structure", label: "자료구조" };
  }
  if (["리눅스", "linux"].includes(value)) {
    return { mode: "mixed", topic: "linux", label: "리눅스" };
  }
  if (["웹", "web", "http"].includes(value)) {
    return { mode: "mixed", topic: "web", label: "웹" };
  }
  if (["api", "인터페이스", "rest"].includes(value)) {
    return { mode: "mixed", topic: "api", label: "API" };
  }
  if (["신기술", "최신기술", "최신"].includes(value)) {
    return { mode: "mixed", topic: "emerging", label: "신기술" };
  }

  return null;
}

function clampQuestionCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 10;
  }
  return Math.min(20, Math.max(1, Math.trunc(count)));
}

function createDescriptor(command: QuizCommand): SetDescriptor {
  const values = new Uint32Array(1);
  if (command.mode === "daily") {
    const kstDay = Math.floor((Date.now() + 9 * 60 * 60 * 1000) / 86_400_000);
    values[0] = Math.imul(kstDay, 2654435761) >>> 0;
  } else {
    crypto.getRandomValues(values);
  }
  return {
    seed: values[0],
    count: command.count,
    mode: command.mode,
    topic: command.topic
  };
}

function buildQuizMessage(descriptor: SetDescriptor): string {
  const questions = selectQuestions(descriptor);
  return formatQuizMessage(getQuizTitle(descriptor), questions, encodeSet(descriptor));
}

function getQuizTitle(descriptor: SetDescriptor): string {
  const titleMap: Partial<Record<StudyMode, string>> = {
    mock: "정보처리기사 실기 모의고사",
    frequent: "빈출 집중 문제",
    terms: "용어·단답 집중 문제",
    calculation: "계산형 집중 문제",
    advanced: "심화 문제",
    daily: "오늘의 문제"
  };
  return descriptor.topic === "all"
    ? (titleMap[descriptor.mode] ?? "정보처리기사 실기·복습 혼합 문제")
    : `${TOPIC_LABELS[descriptor.topic]} 집중 문제`;
}

function formatQuizMessage(title: string, questions: StudyQuestion[], setCode: string): string {
  const questionText = questions
    .map((question, index) => {
      const choices = question.choices ? `\n${question.choices.join("\n")}` : "";
      return `*${index + 1}. [${question.topic} · ${question.difficulty} · ${KIND_LABELS[question.kind]}]*\n${question.prompt}${choices}`;
    })
    .join("\n\n");

  return [
    `:books: *${title}*`,
    "_최근 출제 흐름을 반영한 새 문제이며 실제 기출문장을 복제하지 않습니다._",
    "",
    questionText,
    "",
    "> 답은 숨겨져 있습니다. 이 스레드에서 `정답줘`, `3번 힌트`, `3번 해설`, `전체 해설`을 입력하세요.",
    "> 풀이 후 `3번 맞음` 또는 `3번 틀림`으로 기록할 수 있습니다.",
    `> 세트 코드: \`${setCode}\``
  ].join("\n");
}

async function buildTrackedQuizMessage(
  command: QuizCommand,
  userId: string,
  channelId: string,
  db: D1Database
): Promise<string> {
  const recentlyServed = await getRecentlyServedQuestionIds(db, userId);
  let bestDescriptor = createDescriptor(command);
  let bestQuestions = selectQuestions(bestDescriptor);
  let bestOverlap = countOverlap(bestQuestions, recentlyServed);

  for (let attempt = 0; attempt < 12 && bestOverlap > 0; attempt += 1) {
    const candidate = createDescriptor(command);
    if (command.mode === "daily") candidate.seed = (candidate.seed + attempt + 1) >>> 0;
    const candidateQuestions = selectQuestions(candidate);
    const overlap = countOverlap(candidateQuestions, recentlyServed);
    if (overlap < bestOverlap) {
      bestDescriptor = candidate;
      bestQuestions = candidateQuestions;
      bestOverlap = overlap;
    }
  }

  const code = createSessionCode();
  const title = command.label === "중복 없는" ? "중복 없는 종합 문제" : getQuizTitle(bestDescriptor);
  await saveQuizSession(
    db,
    {
      code,
      userId,
      channelId,
      questionIds: bestQuestions.map((question) => question.id),
      title,
      createdAt: new Date().toISOString()
    },
    bestQuestions
  );

  return formatQuizMessage(title, bestQuestions, code);
}

function countOverlap(questions: StudyQuestion[], ids: Set<string>): number {
  return questions.reduce((count, question) => count + (ids.has(question.id) ? 1 : 0), 0);
}

function createSessionCode(): string {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `SQ1-${values[0].toString(36)}${values[1].toString(36)}`;
}

function selectQuestions(descriptor: SetDescriptor): StudyQuestion[] {
  const random = createSeededRandom(descriptor.seed);
  const selected: StudyQuestion[] = [];
  const topicPool = QUESTIONS.filter((question) => matchesTopic(question, descriptor.topic));

  if (descriptor.topic !== "all") {
    takeUnique(selected, shuffled(topicPool, random), descriptor.count);
    const fallback = filterByMode(QUESTIONS, descriptor.mode);
    takeUnique(selected, shuffled(fallback, random), descriptor.count);
    return selected.slice(0, descriptor.count);
  }

  if (descriptor.mode === "terms") {
    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.kind === "concept"), random), descriptor.count);
  } else if (descriptor.mode === "calculation") {
    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.tags.includes("calculation")), random), descriptor.count);
  } else if (descriptor.mode === "advanced") {
    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.difficulty === "심화"), random), descriptor.count);
  } else if (descriptor.mode === "frequent") {
    const frequentPool = QUESTIONS.filter((question) =>
      question.tags.some((tag) => ["code", "sql", "database", "security", "os", "test"].includes(tag))
    );
    const codeTarget = Math.round(descriptor.count * 0.4);
    const dataTarget = Math.round(descriptor.count * 0.2);
    takeUnique(selected, shuffled(frequentPool.filter((question) => question.kind === "code"), random), codeTarget);
    takeUnique(
      selected,
      shuffled(frequentPool.filter((question) => question.kind === "sql" || question.tags.includes("database")), random),
      codeTarget + dataTarget
    );
    takeUnique(selected, shuffled(frequentPool, random), descriptor.count);
  } else if (descriptor.mode === "choice") {
    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.kind === "choice"), random), descriptor.count);
  } else if (descriptor.mode === "concept") {
    takeUnique(
      selected,
      shuffled(QUESTIONS.filter((question) => question.kind === "concept" || question.kind === "choice"), random),
      descriptor.count
    );
  } else if (descriptor.mode === "practical") {
    const codeTarget = Math.ceil(descriptor.count * 0.6);
    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.kind === "code"), random), codeTarget);
    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.kind === "sql"), random), descriptor.count);
  } else {
    const codeTarget = Math.round(descriptor.count * 0.4);
    const dataTarget = Math.max(1, Math.round(descriptor.count * 0.2));
    const choiceTarget = Math.max(1, Math.round(descriptor.count * 0.2));

    takeUnique(selected, shuffled(QUESTIONS.filter((question) => question.kind === "code"), random), codeTarget);
    takeUnique(
      selected,
      shuffled(
        QUESTIONS.filter(
          (question) => question.kind === "sql" || (question.kind === "concept" && question.tags.includes("database"))
        ),
        random
      ),
      codeTarget + dataTarget
    );
    takeUnique(
      selected,
      shuffled(QUESTIONS.filter((question) => question.kind === "choice"), random),
      codeTarget + dataTarget + choiceTarget
    );
    takeUnique(
      selected,
      shuffled(QUESTIONS.filter((question) => question.kind === "concept"), random),
      descriptor.count
    );
  }

  takeUnique(selected, shuffled(filterByMode(QUESTIONS, descriptor.mode), random), descriptor.count);
  return shuffled(selected.slice(0, descriptor.count), random);
}

function filterByMode(questions: StudyQuestion[], mode: StudyMode): StudyQuestion[] {
  if (mode === "choice") return questions.filter((question) => question.kind === "choice");
  if (mode === "concept") return questions.filter((question) => question.kind === "concept" || question.kind === "choice");
  if (mode === "practical") return questions.filter((question) => question.kind === "code" || question.kind === "sql");
  if (mode === "terms") return questions.filter((question) => question.kind === "concept");
  if (mode === "calculation") return questions.filter((question) => question.tags.includes("calculation"));
  if (mode === "advanced") return questions.filter((question) => question.difficulty === "심화");
  if (mode === "frequent") {
    return questions.filter((question) =>
      question.tags.some((tag) => ["code", "sql", "database", "security", "os", "test"].includes(tag))
    );
  }
  return questions;
}

function matchesTopic(question: StudyQuestion, topic: StudyTopic): boolean {
  if (topic === "all") return true;
  const tags = TOPIC_TAGS[topic];
  return tags.some((tag) => question.tags.includes(tag));
}

function takeUnique(target: StudyQuestion[], source: StudyQuestion[], targetLength: number): void {
  for (const question of source) {
    if (target.length >= targetLength) return;
    if (!target.some((item) => item.id === question.id)) target.push(question);
  }
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function encodeSet(descriptor: SetDescriptor): string {
  return ["IQ3", descriptor.seed.toString(36), descriptor.count, descriptor.mode, descriptor.topic].join("-");
}

function decodeSet(token: string): SetDescriptor | null {
  const match = token.match(
    /^IQ(?:2|3)-([a-z0-9]+)-(\d+)-(mixed|practical|concept|choice|mock|frequent|terms|calculation|advanced|daily)-([a-z_]+)$/i
  );
  if (!match) return null;

  const seed = Number.parseInt(match[1], 36);
  const count = clampQuestionCount(Number(match[2]));
  const mode = match[3].toLowerCase() as StudyMode;
  const topic = match[4].toLowerCase() as StudyTopic;

  if (!Number.isFinite(seed) || !(topic === "all" || topic in TOPIC_TAGS)) return null;
  return { seed, count, mode, topic };
}

async function buildReviewMessage(
  command: ReviewCommand,
  userId: string,
  channelId: string,
  db: D1Database | undefined
): Promise<string> {
  if (!db) return buildDatabaseSetupMessage();

  const questionIds = await getReviewQuestionIds(db, userId, command.count, command.weakFirst);
  const questions = questionIds
    .map((questionId) => QUESTION_BY_ID.get(questionId))
    .filter((question): question is StudyQuestion => Boolean(question));

  if (questions.length === 0) {
    return [
      ":sparkles: *복습할 오답이 아직 없습니다.*",
      "문제를 푼 뒤 같은 스레드에서 `3번 맞음` 또는 `3번 틀림`으로 기록해 주세요."
    ].join("\n");
  }

  const code = createSessionCode();
  const title = command.weakFirst ? "취약 문제 집중 복습" : "오답 복습 문제";
  await saveQuizSession(
    db,
    {
      code,
      userId,
      channelId,
      questionIds: questions.map((question) => question.id),
      title,
      createdAt: new Date().toISOString()
    },
    questions
  );

  return formatQuizMessage(title, questions, code);
}

async function buildGradeMessage(
  command: GradeCommand,
  userId: string,
  channel: string,
  threadTs: string | undefined,
  env: Env
): Promise<string> {
  if (!env.DB) return buildDatabaseSetupMessage();
  if (!threadTs) {
    return ":information_source: 채점 기록은 해당 문제의 *스레드 안에서* `3번 맞음`처럼 입력해 주세요.";
  }

  const found = await findQuestionsInThread(env.SLACK_BOT_TOKEN, channel, threadTs, env.DB);
  if (!found) {
    return ":warning: 이 스레드에서 문제 세트를 찾지 못했습니다. 새로 `문제`를 입력해 주세요.";
  }

  const question = found.questions[command.target - 1];
  if (!question) {
    return `:warning: ${command.target}번 문제는 없습니다. 1번부터 ${found.questions.length}번 사이로 입력하세요.`;
  }

  const result = await recordGrade(env.DB, userId, question.id, command.isCorrect, found.code);
  if (command.isCorrect) {
    const reviewText = result.nextReviewDays
      ? `${result.nextReviewDays}일 뒤 다시 복습하도록 저장했습니다.`
      : "연속 정답으로 오답 복습을 완료했습니다.";
    return `:white_check_mark: *${command.target}번을 맞음으로 기록했습니다.*\n${reviewText}`;
  }

  return [
    `:memo: *${command.target}번을 오답으로 저장했습니다.*`,
    `누적 ${result.wrongCount}회 틀린 문제이며, 1일 뒤 복습 대상으로 표시했습니다.`,
    `바로 확인하려면 \`${command.target}번 풀이\`, 다시 풀려면 \`오답\`을 입력하세요.`
  ].join("\n");
}

async function buildRemoveReviewMessage(
  command: RemoveReviewCommand,
  userId: string,
  channel: string,
  threadTs: string | undefined,
  env: Env
): Promise<string> {
  if (!env.DB) return buildDatabaseSetupMessage();
  if (!threadTs) {
    return ":information_source: 오답 해제는 해당 문제의 *스레드 안에서* `1번 오답해제`처럼 입력해 주세요.";
  }

  const found = await findQuestionsInThread(env.SLACK_BOT_TOKEN, channel, threadTs, env.DB);
  if (!found) {
    return ":warning: 이 스레드에서 문제 세트를 찾지 못했습니다. `오답`을 입력해 복습 문제를 다시 받아 주세요.";
  }

  const question = found.questions[command.target - 1];
  if (!question) {
    return `:warning: ${command.target}번 문제는 없습니다. 1번부터 ${found.questions.length}번 사이로 입력하세요.`;
  }

  const removed = await removeFromReviewQueue(env.DB, userId, question.id);
  return removed
    ? [
        `:wastebasket: *${command.target}번을 오답 복습에서 해제했습니다.*`,
        "기존 채점 기록과 학습 통계는 그대로 유지됩니다."
      ].join("\n")
    : `:information_source: ${command.target}번은 현재 오답 복습 목록에 없습니다.`;
}

async function buildStatsMessage(
  userId: string,
  db: D1Database | undefined,
  todayOnly: boolean
): Promise<string> {
  if (!db) return buildDatabaseSetupMessage();
  const attempts = await getAttempts(db, userId, todayOnly);
  if (attempts.length === 0) {
    return todayOnly
      ? ":bar_chart: 오늘 기록한 채점 결과가 아직 없습니다."
      : ":bar_chart: 학습 기록이 아직 없습니다. 문제 스레드에서 `3번 맞음` 또는 `3번 틀림`을 입력해 주세요.";
  }

  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const rate = Math.round((correct / attempts.length) * 100);
  const topicStats = summarizeTopics(attempts);
  const weakest = [...topicStats.entries()]
    .filter(([, value]) => value.total >= 2)
    .sort((left, right) => left[1].correct / left[1].total - right[1].correct / right[1].total)
    .slice(0, 3);
  const streak = todayOnly ? 0 : calculateStreak(attempts);

  return [
    `:bar_chart: *${todayOnly ? "오늘의 학습 기록" : "학습 통계"}*`,
    `• 채점: *${attempts.length}문제*`,
    `• 정답: *${correct}문제* · 정답률 *${rate}%*`,
    ...(todayOnly ? [] : [`• 연속 학습: *${streak}일*`]),
    "",
    weakest.length > 0 ? "*보완할 분야*" : "*분야별 기록*",
    ...(weakest.length > 0
      ? weakest.map(([topic, value]) => `• ${topic}: ${Math.round((value.correct / value.total) * 100)}% (${value.correct}/${value.total})`)
      : [...topicStats.entries()].slice(0, 5).map(([topic, value]) => `• ${topic}: ${value.correct}/${value.total}`)),
    "",
    "> 틀린 문제는 `오답 5개`, 취약 순서는 `취약 5개`로 다시 풀 수 있습니다."
  ].join("\n");
}

async function buildDailySubscriptionMessage(
  command: DailySubscriptionCommand,
  userId: string,
  channelId: string,
  db: D1Database | undefined
): Promise<string> {
  if (!db) return buildDatabaseSetupMessage();
  if (command.action === "status") {
    const status = await getDailySubscriptionStatus(db, userId, channelId);
    if (!status || !status.enabled) {
      return [
        ":no_bell: *자동 출제는 현재 꺼져 있습니다.*",
        "켜려면 `매일 문제 5개 켜기`를 입력하세요."
      ].join("\n");
    }
    return [
      ":alarm_clock: *자동 출제가 켜져 있습니다.*",
      `• 시간: 매일 *오전 9시*`,
      `• 개수: *${status.questionCount}문제*`,
      `• 채널: 현재 채널`,
      "끄려면 `매일 문제 끄기`를 입력하세요."
    ].join("\n");
  }

  const enabled = command.action === "enable";
  await setDailySubscription(db, userId, channelId, enabled, command.count);
  return enabled
    ? `:alarm_clock: 매일 *오전 9시*에 이 채널로 *${command.count}문제*를 보내겠습니다.`
    : ":no_bell: 매일 문제 자동 출제를 껐습니다.";
}

function summarizeTopics(attempts: AttemptRecord[]): Map<string, { total: number; correct: number }> {
  const result = new Map<string, { total: number; correct: number }>();
  for (const attempt of attempts) {
    const topic = QUESTION_BY_ID.get(attempt.questionId)?.topic ?? "기타";
    const current = result.get(topic) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (attempt.isCorrect) current.correct += 1;
    result.set(topic, current);
  }
  return result;
}

function calculateStreak(attempts: AttemptRecord[]): number {
  const studyDays = new Set(attempts.map((attempt) => toKoreanDate(attempt.answeredAt)));
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  let cursor = studyDays.has(todayKey) ? today : studyDays.has(yesterday) ? new Date(today.getTime() - 86_400_000) : null;
  let streak = 0;

  while (cursor && studyDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

function toKoreanDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function buildDatabaseSetupMessage(): string {
  return ":information_source: 학습 기록 저장소가 아직 연결되지 않았습니다. D1 연결 후 사용할 수 있습니다.";
}

async function buildRevealMessage(
  command: RevealCommand,
  channel: string,
  threadTs: string | undefined,
  env: Env
): Promise<string> {
  if (!threadTs) {
    return ":information_source: 정답·힌트·해설은 해당 문제의 *스레드 안에서* 입력해 주세요.";
  }

  const found = await findQuestionsInThread(env.SLACK_BOT_TOKEN, channel, threadTs, env.DB);
  if (!found) {
    return ":warning: 이 스레드에서 문제 세트를 찾지 못했습니다. 새로 `문제줘`를 입력해 주세요.";
  }

  const questions = found.questions;

  if (command.target !== "all") {
    const question = questions[command.target - 1];
    if (!question) return `:warning: ${command.target}번 문제는 없습니다. 1번부터 ${questions.length}번 사이로 입력하세요.`;
    return buildSingleReveal(command.action, command.target, question);
  }

  if (command.action === "answer") {
    return [
      ":white_check_mark: *전체 정답*",
      "",
      ...questions.map((question, index) => `*${index + 1}번* — ${question.answer}`),
      "",
      "> 자세한 설명은 `3번 해설` 또는 `전체 해설`을 입력하세요."
    ].join("\n");
  }

  return [
    ":mag: *전체 해설*",
    "",
    ...questions.map((question, index) => buildExplanationBlock(index + 1, question))
  ].join("\n\n");
}

function buildSingleReveal(action: RevealCommand["action"], number: number, question: StudyQuestion): string {
  if (action === "hint") {
    return [
      `:bulb: *${number}번 힌트*`,
      question.hint,
      "",
      "> 정답은 공개하지 않았습니다. 준비되면 `" + number + "번 정답` 또는 `" + number + "번 해설`을 입력하세요."
    ].join("\n");
  }

  if (action === "answer") {
    return `:white_check_mark: *${number}번 정답*\n${question.answer}`;
  }

  return `:mag: *${number}번 해설*\n\n${buildExplanationBlock(number, question)}`;
}

function buildExplanationBlock(number: number, question: StudyQuestion): string {
  return [
    `*${number}번 · ${question.topic}*`,
    `• *정답:* ${question.answer}`,
    `• *왜 정답인가:* ${question.explanation}`,
    `• *헷갈리기 쉬운 점:* ${question.confusion}`
  ].join("\n");
}

async function findQuestionsInThread(
  botToken: string,
  channel: string,
  threadTs: string,
  db?: D1Database
): Promise<{ code: string; questions: StudyQuestion[] } | null> {
  const url = new URL("https://slack.com/api/conversations.replies");
  url.searchParams.set("channel", channel);
  url.searchParams.set("ts", threadTs);
  url.searchParams.set("limit", "100");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${botToken}` } });
  const result = (await response.json()) as {
    ok?: boolean;
    error?: string;
    messages?: SlackThreadMessage[];
  };

  if (!response.ok || !result.ok) {
    throw new Error(`Slack 스레드 조회 실패: ${result.error ?? response.status}`);
  }

  for (const message of [...(result.messages ?? [])].reverse()) {
    const token = message.text?.match(/세트 코드:\s*`?((?:IQ[23]-[a-z0-9_-]+)|(?:SQ1-[a-z0-9]+))`?/i)?.[1];
    if (!token) continue;

    if (/^SQ1-/i.test(token)) {
      if (!db) return null;
      const session = await loadQuizSession(db, token);
      if (!session) return null;
      const questions = session.questionIds
        .map((questionId) => QUESTION_BY_ID.get(questionId))
        .filter((question): question is StudyQuestion => Boolean(question));
      return questions.length > 0 ? { code: token, questions } : null;
    }

    const descriptor = decodeSet(token);
    if (descriptor) return { code: token, questions: selectQuestions(descriptor) };
  }
  return null;
}

function buildHelpMessage(): string {
  return [
    ":blue_book: *공부봇 도움말*",
    "개수를 생략하면 10문제이며, `줘`·`주세요`는 붙여도 되고 생략해도 됩니다.",
    "",
    "*기본 출제*",
    "`문제`  `문제 5개`  `중복 없이 문제 10개`",
    "`모의고사`  `오늘 문제`",
    "",
    "*유형별 출제*",
    "`실전`  `개념`  `보기`  `빈출`",
    "`코드`  `용어`  `계산`  `심화`",
    "",
    "*과목별 출제*",
    "`프로그래밍`  `데이터베이스`  `소프트웨어공학`",
    "`운영체제`  `네트워크`  `리눅스`",
    "`자료구조`  `알고리즘`  `웹`  `API`",
    "`보안`  `신기술`",
    "",
    "> 예: `프로그래밍 줘` · `보안 5개 줘` · `SQL 문제 3개 주세요`",
    "> `과목`을 입력하면 세부 분야를 모두 볼 수 있습니다.",
    "",
    "*문제를 받은 뒤 같은 스레드에서*",
    "`3번 힌트`  `3번 정답`  `3번 풀이`",
    "`전체 정답`  `전체 풀이`",
    "`3번 맞음`  `3번 틀림` → 학습 결과 기록",
    "",
    "*오답 · 통계*",
    "`오답`  `오답 5개`  `복습`  `취약 5개`",
    "오답 문제 스레드에서 `1번 오답해제`",
    "`통계`  `오늘 기록`",
    "",
    "*매일 자동 출제*",
    "`매일 문제 5개 켜기`  `매일 문제 끄기`",
    "`자동출제 확인` → 켜짐·꺼짐, 시간, 문제 개수 확인",
    "> 매일 오전 9시에 설정한 문제를 이 채널로 보냅니다."
  ].join("\n");
}

function buildSubjectsMessage(): string {
  return [
    ":books: *출제 가능한 과목*",
    "",
    "*프로그래밍*",
    "`프로그래밍`  `C`  `자바`  `파이썬`",
    "",
    "*데이터베이스 · SQL*",
    "`데이터베이스`  `SQL`  `DB`  `정규화`",
    "",
    "*소프트웨어공학 · 테스트*",
    "`소프트웨어공학`  `설계`  `UML`  `디자인패턴`  `테스트`",
    "",
    "*운영체제 · 네트워크 · 리눅스*",
    "`운영체제`  `스케줄링`  `네트워크`  `리눅스`",
    "",
    "*자료구조 · 알고리즘*",
    "`자료구조`  `알고리즘`",
    "",
    "*웹 · API · 인터페이스*",
    "`웹`  `HTTP`  `API`  `REST`  `인터페이스`",
    "",
    "*보안 · 신기술*",
    "`보안`  `신기술`",
    "",
    "> 과목 뒤에 개수와 `줘`를 자유롭게 붙일 수 있습니다.",
    "> 예: `자료구조 5개` · `신기술 10개 줘`"
  ].join("\n");
}

async function postSlackMessage(botToken: string, channel: string, text: string, threadTs?: string): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({ channel, text, thread_ts: threadTs })
  });

  const result = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !result.ok) {
    throw new Error(`Slack 메시지 전송 실패: ${result.error ?? response.status}`);
  }
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

async function verifySlackSignature(request: Request, rawBody: string, signingSecret: string): Promise<boolean> {
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");

  if (!timestamp || !signature || !signingSecret) return false;

  const requestAge = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(requestAge) || requestAge > 60 * 5) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`v0:${timestamp}:${rawBody}`));
  const expected = `v0=${toHex(signed)}`;
  return timingSafeEqual(expected, signature);
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
