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
  };
}

interface QuizCommand {
  type: "quiz";
  count: number;
  topic?: string;
}

interface HelpCommand {
  type: "help";
}

type Command = QuizCommand | HelpCommand | null;

const TEST_QUESTIONS = [
  "애자일(Agile)의 핵심 특징 3가지를 쓰시오.",
  "XP의 핵심 가치 5가지를 쓰시오.",
  "리팩터링(Refactoring)의 정의를 쓰시오.",
  "응집도(Cohesion) 중 가장 좋은 것과 가장 나쁜 것을 쓰시오.",
  "결합도(Coupling) 중 가장 좋은 것과 가장 나쁜 것을 쓰시오.",
  "제3정규형(3NF)에서 제거해야 하는 함수 종속을 쓰시오.",
  "ACID 중 트랜잭션이 모두 수행되거나 모두 취소되어야 한다는 성질을 쓰시오.",
  "프로세스의 준비(Ready) 상태와 대기(Waiting) 상태의 차이를 쓰시오.",
  "교착상태(Deadlock)의 발생 조건 4가지를 쓰시오.",
  "OSI 7계층 중 TCP와 UDP가 동작하는 계층을 쓰시오."
];

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "study-hub-bot",
        message: "공부봇이 실행 중입니다.",
        localTest: "/test/command?text=문제줘"
      });
    }

    // Slack 연결 전 로컬에서 명령어 처리를 확인하기 위한 테스트 주소다.
    if (request.method === "GET" && url.pathname === "/test/command") {
      const input = url.searchParams.get("text")?.trim() || "문제줘";
      const command = parseCommand(input);

      if (!command) {
        return new Response(
          "인식하지 못한 명령어입니다. 문제줘, 문제 5개 줘, 스케줄링 문제줘, 도움말 중 하나를 입력하세요.",
          {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          }
        );
      }

      const message =
        command.type === "help"
          ? buildHelpMessage()
          : buildTestQuiz(command.count, command.topic);

      return new Response(message, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
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

    // Slack은 3초 이내 응답을 요구하므로 실제 처리는 waitUntil에서 계속한다.
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
    !event.text
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

  const message =
    command.type === "help"
      ? buildHelpMessage()
      : buildTestQuiz(command.count, command.topic);

  await postSlackMessage(env.SLACK_BOT_TOKEN, event.channel, message, event.ts);
}

export function parseCommand(input: string): Command {
  const text = input.replace(/<@[^>]+>/g, "").trim();

  if (/^(도움말|명령어|사용법)$/.test(text)) {
    return { type: "help" };
  }

  if (/^문제줘$/.test(text)) {
    return { type: "quiz", count: 10 };
  }

  const countMatch = text.match(/^문제\s*(\d+)\s*개\s*줘$/);

  if (countMatch) {
    return {
      type: "quiz",
      count: clampQuestionCount(Number(countMatch[1]))
    };
  }

  const topicMatch = text.match(/^(.+?)\s*문제(?:\s*(\d+)\s*개)?\s*줘$/);

  if (topicMatch) {
    return {
      type: "quiz",
      topic: topicMatch[1].trim(),
      count: clampQuestionCount(topicMatch[2] ? Number(topicMatch[2]) : 10)
    };
  }

  return null;
}

function clampQuestionCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 10;
  }

  return Math.min(10, Math.max(1, Math.trunc(count)));
}

function buildTestQuiz(count: number, topic?: string): string {
  const questions = TEST_QUESTIONS.slice(0, count)
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n\n");

  const topicLine = topic
    ? `요청한 주제: *${topic}*\n현재 1차 테스트 버전이라 이번에는 종합 문제가 나옵니다.\n\n`
    : "";

  return [
    ":books: *정보처리기사 실기 테스트 문제*",
    "",
    topicLine + questions,
    "",
    "> 아직은 Slack 연결을 확인하는 1차 버전입니다. 정답과 AI 문제 생성은 다음 단계에서 추가합니다."
  ].join("\n");
}

function buildHelpMessage(): string {
  return [
    ":blue_book: *공부봇 사용법*",
    "",
    "• `문제줘` → 종합 문제 10개",
    "• `문제 5개 줘` → 원하는 개수",
    "• `스케줄링 문제줘` → 주제 지정",
    "• `도움말` → 명령어 다시 보기"
  ].join("\n");
}

async function postSlackMessage(
  botToken: string,
  channel: string,
  text: string,
  threadTs?: string
): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      channel,
      text,
      thread_ts: threadTs
    })
  });

  const result = (await response.json()) as { ok?: boolean; error?: string };

  if (!response.ok || !result.ok) {
    throw new Error(`Slack 메시지 전송 실패: ${result.error ?? response.status}`);
  }
}

async function verifySlackSignature(
  request: Request,
  rawBody: string,
  signingSecret: string
): Promise<boolean> {
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");

  if (!timestamp || !signature || !signingSecret) {
    return false;
  }

  const requestAge = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));

  if (!Number.isFinite(requestAge) || requestAge > 60 * 5) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`v0:${timestamp}:${rawBody}`)
  );
  const expected = `v0=${toHex(signed)}`;

  return timingSafeEqual(expected, signature);
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}
