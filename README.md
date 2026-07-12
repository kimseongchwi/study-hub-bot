# Study Hub Bot

Slack에서 정보처리기사 실기와 개념 복습 문제를 풀 수 있는 Cloudflare Worker 프로젝트입니다.

3.0 버전은 최근 출제 흐름을 참고해 직접 만든 150문제 은행에서 코드 추적, SQL, 개념 단답, 보기형 문제를 균형 있게 출제합니다. 신기술·자료구조·알고리즘·웹/API·리눅스 영역도 함께 학습할 수 있습니다. 실제 기출문장을 복제하지 않으며, 문제 스레드에서 정답·힌트·쉬운 풀이와 헷갈리는 개념을 확인할 수 있습니다.

## 문제은행 구성

문제는 `src/question-bank` 아래에서 자격증별로 관리합니다.

```text
src/question-bank/
├─ 정보처리기사/  # 프로그래밍, DB·SQL, 설계·테스트, 시스템, 보안, 신기술 등
├─ SQLD/
├─ index.ts
└─ types.ts
```

현재 기본 문제은행은 `정보처리기사`이며, `SQLD` 폴더에는 추후 문제를 추가할 수 있는 진입점이 준비되어 있습니다. 세부적인 파일 역할과 새 자격증 추가 방법은 `src/question-bank/README.md`를 참고합니다.

## 실행 환경

- Node.js 22 이상
- npm 10 이상

Node 18에서는 최신 Wrangler가 실행되지 않습니다. nvm을 사용한다면 프로젝트 폴더에서 다음 명령으로 맞춥니다.

```bash
nvm install 22
nvm use
```

## 지원 명령어

- `문제`
- `문제 5개`
- `실전`, `개념`, `신기술`, `모의고사`
- `빈출`, `코드`, `용어`, `계산`, `심화`
- `오늘 문제`
- `과목`
- 과목명 뒤에 개수 입력: `자료구조 5개`, `신기술 10개`
- 문제 스레드에서 `전체 정답`
- 문제 스레드에서 `3번 힌트`
- 문제 스레드에서 `3번 정답`
- 문제 스레드에서 `3번 풀이`
- 문제 스레드에서 `전체 풀이`
- `도움말`

기존의 `문제줘`, `SQL 문제 5개 줘`, `3번 해설`, `전체 해설` 표현도 계속 인식합니다. 기본 10문제는 코드 추적 비중을 가장 높게 두고 SQL·데이터베이스, 개념 단답, 보기형을 섞습니다. `모의고사`는 20문제를 출제합니다.

## 1. 설치

```bash
npm install
```

## 2. 로컬 환경변수

`.dev.vars.example`을 복사해 `.dev.vars`를 만들고 실제 값을 입력합니다.

```bash
cp .dev.vars.example .dev.vars
```

중요: `.dev.vars`와 Slack 토큰은 GitHub에 올리지 않습니다.

## 3. 로컬 실행

```bash
npm run dev
```

이 명령을 실행한 터미널에는 다른 내용을 입력하지 않고 그대로 둡니다. 아래 주소는 터미널이 아니라 Chrome 또는 Safari의 주소창에 입력합니다.

브라우저에서 `http://localhost:8787`을 열었을 때 아래와 비슷한 JSON이 나오면 정상입니다.

```json
{
  "ok": true,
  "service": "study-hub-bot",
  "message": "공부봇이 실행 중입니다."
}
```

다음 주소를 브라우저에서 열면 Slack 연결 전에도 `문제줘` 명령을 로컬에서 시험할 수 있습니다. 이 테스트 경로는 보안을 위해 로컬 환경에서만 동작하며 배포된 Worker에서는 `404 Not Found`를 반환합니다.

```text
http://localhost:8787/test/command?text=문제줘
```

다른 명령어도 주소의 `text=` 뒤만 바꿔 확인합니다.

```text
http://localhost:8787/test/command?text=문제%205개%20줘
http://localhost:8787/test/command?text=실전%20문제%205개%20줘
http://localhost:8787/test/command?text=보기%20문제%203개%20줘
http://localhost:8787/test/command?text=SQL%20문제%204개%20줘
http://localhost:8787/test/command?text=도움말
```

여기까지는 Cloudflare 계정과 Slack 토큰이 없어도 실행됩니다.

## 4. Cloudflare 배포

```bash
npx wrangler login
npm run deploy
```

배포 후 출력되는 `https://study-hub-bot.<계정>.workers.dev` 주소를 보관합니다.

## 5. Cloudflare 비밀값 등록

```bash
npx wrangler secret put SLACK_SIGNING_SECRET
npx wrangler secret put SLACK_BOT_TOKEN
npx wrangler secret put SLACK_CHANNEL_ID
```

`SLACK_CHANNEL_ID`에는 공부봇이 응답할 Slack 채널의 ID를 입력합니다. 실제 토큰과 채널 ID는 `wrangler.jsonc`, README 또는 GitHub에 기록하지 않습니다.

## 6. Slack 앱 설정

1. `https://api.slack.com/apps`에서 **Create New App → From scratch**를 선택합니다.
2. 앱 이름을 `공부봇`으로 정하고 개인 자격증 워크스페이스를 선택합니다.
3. **OAuth & Permissions → Bot Token Scopes**에 다음 권한을 추가합니다.
   - `chat:write`
   - `channels:history`
4. 앱을 워크스페이스에 설치하고 `xoxb-`로 시작하는 Bot Token을 복사합니다.
5. **Basic Information → App Credentials**에서 Signing Secret을 복사합니다.
6. `#정보처리기사` 채널의 **통합 → 앱 추가**에서 `공부봇`을 추가합니다.
7. **Event Subscriptions**를 켜고 Request URL에 다음 주소를 입력합니다.

```text
https://study-hub-bot.<계정>.workers.dev/slack/events
```

8. **Subscribe to bot events**에 `message.channels`를 추가합니다.
9. 권한 변경 후 앱을 워크스페이스에 다시 설치합니다.

## 7. 테스트

`#정보처리기사` 채널에서 입력합니다.

```text
문제줘
```

명령 메시지의 스레드에 테스트 문제 10개가 나타나면 성공입니다.

## 기존 설치에서 2차 버전으로 업데이트

이미 Slack 앱과 Worker가 연결되어 있다면 추가 권한이나 비밀값 없이 프로젝트 폴더에서 다음 명령만 실행합니다.

```bash
npm run deploy
```

배포가 끝나면 Slack에서 `문제줘`를 입력합니다. 정답과 해설 명령은 공부봇 답변이 달린 같은 스레드 안에서 사용해야 합니다.

## 다음 개발 순서

1. 사용자의 답안 자동 채점
2. 오답 유형별 재출제
3. Cloudflare Workers AI를 이용한 추가 변형 문제 생성
4. Notion 오답노트 자동 저장

## 자동 배포

`main` 브랜치에 커밋이 올라오면 Cloudflare Workers가 자동으로 빌드하고 배포합니다.

## 보안

- `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`는 Cloudflare Secrets로만 관리합니다.
- 로컬 비밀값은 `.dev.vars`에 저장하며 Git에 커밋하지 않습니다.
- 배포된 Worker의 `/test/command` 경로는 외부에서 사용할 수 없습니다.
- 토큰이 로그, 화면 공유 또는 저장소에 노출되면 즉시 Slack에서 폐기하고 Cloudflare 비밀값을 교체합니다.
