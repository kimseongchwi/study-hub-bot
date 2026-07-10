import { QUESTIONS, type QuestionKind, type StudyQuestion } from "./questions";

export interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID?: string;
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
  };
}

interface SlackThreadMessage {
  text?: string;
}

type StudyMode = "mixed" | "practical" | "concept" | "choice";
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
  | "software";

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

type Command = QuizCommand | RevealCommand | HelpCommand | null;

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
  software: ["software", "설계", "uml"]
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "study-hub-bot",
        version: "2.1.0",
        message: "공부봇이 실행 중입니다.",
        localTest: "/test/command?text=문제줘"
      });
    }

    if (request.method === "GET" && url.pathname === "/test/command") {
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

      if (command.type === "reveal") {
        return textResponse("정답·힌트·해설은 Slack 문제 스레드 안에서 요청하세요.", 400);
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

  if (env.SLACK_CHANNEL_ID && event.channel !== env.SLACK_CHANNEL_ID) {
    return;
  }

  const command = parseCommand(event.text);

  if (!command) {
    return;
  }

  const threadTs = event.thread_ts ?? event.ts;
  let message: string;

  if (command.type === "help") {
    message = buildHelpMessage();
  } else if (command.type === "quiz") {
    message = buildQuizMessage(createDescriptor(command));
  } else {
    message = await buildRevealMessage(command, event.channel, event.thread_ts, env.SLACK_BOT_TOKEN);
  }

  await postSlackMessage(env.SLACK_BOT_TOKEN, event.channel, message, threadTs);
}

export function parseCommand(input: string): Command {
  const text = input.replace(/<@[^>]+>/g, "").trim();

  if (/^(도움말|명령어|사용법)$/.test(text)) {
    return { type: "help" };
  }

  const numberedReveal = text.match(/^(\d+)\s*번\s*(정답|힌트|해설)$/);

  if (numberedReveal) {
    const actionMap = { 정답: "answer", 힌트: "hint", 해설: "explain" } as const;
    return {
      type: "reveal",
      action: actionMap[numberedReveal[2] as keyof typeof actionMap],
      target: Number(numberedReveal[1])
    };
  }

  if (/^(정답|정답줘|전체\s*정답)$/.test(text)) {
    return { type: "reveal", action: "answer", target: "all" };
  }

  if (/^(해설|해설줘|전체\s*해설)$/.test(text)) {
    return { type: "reveal", action: "explain", target: "all" };
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
    return {
      type: "quiz",
      count: clampQuestionCount(topicMatch[2] ? Number(topicMatch[2]) : 10),
      ...normalized
    };
  }

  return null;
}

function normalizeTopic(raw: string): Pick<QuizCommand, "mode" | "topic" | "label"> {
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

  return { mode: "mixed", topic: "all", label: raw.trim() };
}

function clampQuestionCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 10;
  }
  return Math.min(10, Math.max(1, Math.trunc(count)));
}

function createDescriptor(command: QuizCommand): SetDescriptor {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return {
    seed: values[0],
    count: command.count,
    mode: command.mode,
    topic: command.topic
  };
}

function buildQuizMessage(descriptor: SetDescriptor): string {
  const questions = selectQuestions(descriptor);
  const questionText = questions
    .map((question, index) => {
      const choices = question.choices ? `\n${question.choices.join("\n")}` : "";
      return `*${index + 1}. [${question.topic} · ${question.difficulty} · ${KIND_LABELS[question.kind]}]*\n${question.prompt}${choices}`;
    })
    .join("\n\n");

  return [
    ":books: *정보처리기사 실기·복습 혼합 문제*",
    "_최근 출제 흐름을 반영한 새 문제이며 실제 기출문장을 복제하지 않습니다._",
    "",
    questionText,
    "",
    "> 답은 숨겨져 있습니다. 이 스레드에서 `정답줘`, `3번 힌트`, `3번 해설`, `전체 해설`을 입력하세요.",
    `> 세트 코드: \`${encodeSet(descriptor)}\``
  ].join("\n");
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

  if (descriptor.mode === "choice") {
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
  return ["IQ2", descriptor.seed.toString(36), descriptor.count, descriptor.mode, descriptor.topic].join("-");
}

function decodeSet(token: string): SetDescriptor | null {
  const match = token.match(/^IQ2-([a-z0-9]+)-(\d+)-(mixed|practical|concept|choice)-([a-z]+)$/i);
  if (!match) return null;

  const seed = Number.parseInt(match[1], 36);
  const count = clampQuestionCount(Number(match[2]));
  const mode = match[3].toLowerCase() as StudyMode;
  const topic = match[4].toLowerCase() as StudyTopic;

  if (!Number.isFinite(seed) || !(topic === "all" || topic in TOPIC_TAGS)) return null;
  return { seed, count, mode, topic };
}

async function buildRevealMessage(
  command: RevealCommand,
  channel: string,
  threadTs: string | undefined,
  botToken: string
): Promise<string> {
  if (!threadTs) {
    return ":information_source: 정답·힌트·해설은 해당 문제의 *스레드 안에서* 입력해 주세요.";
  }

  const descriptor = await findSetInThread(botToken, channel, threadTs);
  if (!descriptor) {
    return ":warning: 이 스레드에서 문제 세트를 찾지 못했습니다. 새로 `문제줘`를 입력해 주세요.";
  }

  const questions = selectQuestions(descriptor);

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

async function findSetInThread(botToken: string, channel: string, threadTs: string): Promise<SetDescriptor | null> {
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
    const token = message.text?.match(/세트 코드:\s*`?(IQ2-[a-z0-9-]+)`?/i)?.[1];
    if (token) return decodeSet(token);
  }
  return null;
}

function buildHelpMessage(): string {
  return [
    ":blue_book: *공부봇, 이렇게 사용하세요*",
    "원하는 문제를 말하면 바로 출제해 드려요.",
    "",
    "*바로 시작*",
    "`문제줘`  기본 혼합 10문제",
    "`문제 5개 줘`  원하는 개수만 출제",
    "`실전 문제줘`  코드·SQL 중심",
    "`개념 문제줘`  단답·보기 중심",
    "",
    "*과목을 골라서*",
    "`C언어 문제줘`  `Java 문제줘`  `Python 문제줘`",
    "`SQL 문제줘`  `DB 문제줘`  `보안 문제줘`",
    "`네트워크 문제줘`  `스케줄링 문제줘`",
    "",
    "*문제를 받은 뒤 같은 스레드에서*",
    "`3번 힌트`  힌트만 보기",
    "`3번 정답`  정답만 확인",
    "`3번 해설`  풀이와 혼동 포인트 확인",
    "`정답줘`  전체 정답 · `전체 해설`  전체 풀이",
    "",
    "> 예시: `SQL 문제 5개 줘`"
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
