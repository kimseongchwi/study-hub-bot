# Study Hub Bot

Slack에서 정보처리기사 실기와 개념 복습 문제를 풀 수 있는 Cloudflare Worker 프로젝트입니다.

4.0 버전은 최근 출제 흐름을 참고해 직접 만든 150문제 은행에서 코드 추적, SQL, 개념 단답, 보기형 문제를 균형 있게 출제합니다. D1에 사용자별 정답·오답, 복습 주기, 통계와 최근 출제 기록을 저장하며 매일 오전 9시 자동 출제도 지원합니다. 실제 기출문장을 복제하지 않으며, 문제 스레드에서 정답·힌트·쉬운 풀이와 헷갈리는 개념을 확인할 수 있습니다.

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
- 문제 스레드에서 `3번 맞음` 또는 `3번 틀림`
- `오답 5개`, `복습`, `취약 5개`
- 오답 문제 스레드에서 `1번 오답해제`
- `통계`, `오늘 기록`
- `중복 없이 문제 10개`
- `매일 문제 5개 켜기`, `매일 문제 끄기`, `자동출제 확인`
- `도움말`

기존의 `문제줘`, `SQL 문제 5개 줘`, `3번 해설`, `전체 해설` 표현도 계속 인식합니다. 기본 10문제는 코드 추적 비중을 가장 높게 두고 SQL·데이터베이스, 개념 단답, 보기형을 섞습니다. `모의고사`는 20문제를 출제합니다.

모든 출제·정답 명령에는 `줘` 또는 `주세요`를 붙일 수 있습니다. 예를 들어 `프로그래밍`, `프로그래밍 줘`, `프로그래밍 5개 줘`, `프로그래밍 문제 5개 주세요`를 모두 인식합니다.

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

## 5. 무료 학습 기록 저장소 연결

정답·오답, 복습, 통계, 중복 방지와 매일 자동 출제는 Cloudflare D1을 사용합니다. 아래 명령은 `DB` 바인딩으로 데이터베이스를 만들고 `wrangler.jsonc`에 연결 정보를 자동으로 추가합니다.

```bash
npx wrangler d1 create study-hub-bot-db --binding DB --update-config
npm run db:migrate:remote
npm run deploy
```

로컬에서도 기록 기능을 시험하려면 로컬 마이그레이션을 한 번 실행합니다.

```bash
npm run db:migrate:local
npm run dev
```

`migrations/0001_learning.sql`에는 문제 세트, 출제 이력, 채점 결과, 오답 복습 주기와 매일 출제 설정이 들어 있습니다. 문제를 틀리면 다음 날, 이후 맞히면 3일·7일·14일 간격으로 복습합니다. 3회 연속 맞히면 기본 오답 목록에서 제외됩니다.

## 6. Cloudflare 비밀값 등록

```bash
npx wrangler secret put SLACK_SIGNING_SECRET
npx wrangler secret put SLACK_BOT_TOKEN
npx wrangler secret put SLACK_CHANNEL_ID
```

`SLACK_CHANNEL_ID`에는 공부봇이 응답할 Slack 채널의 ID를 입력합니다. 실제 토큰과 채널 ID는 `wrangler.jsonc`, README 또는 GitHub에 기록하지 않습니다.

## 7. Slack 앱 설정

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

## 8. 테스트

`#정보처리기사` 채널에서 입력합니다.

```text
문제줘
```

명령 메시지의 스레드에 테스트 문제 10개가 나타나면 성공입니다.

## 기존 설치에서 4.0 버전으로 업데이트

이미 Slack 앱과 Worker가 연결되어 있다면 Slack 권한과 비밀값은 그대로 사용합니다. D1을 한 번 생성하고 마이그레이션한 뒤 배포합니다.

```bash
npx wrangler d1 create study-hub-bot-db --binding DB --update-config
npm run db:migrate:remote
npm run deploy
```

배포가 끝나면 Slack에서 `문제줘`를 입력합니다. 정답과 해설 명령은 공부봇 답변이 달린 같은 스레드 안에서 사용해야 합니다.

## 학습 기록 사용 순서

1. `문제 5개`로 문제를 받습니다.
2. 문제 스레드에서 `3번 정답` 또는 `3번 풀이`를 확인합니다.
3. 같은 스레드에서 `3번 맞음` 또는 `3번 틀림`으로 기록합니다.
4. `오답 5개`나 `취약 5개`로 다시 풉니다.
5. `통계`로 정답률과 보완할 분야를 확인합니다.

실수로 등록했거나 더 이상 복습하지 않을 문제는 해당 오답 문제 스레드에서 `1번 오답해제`처럼 입력합니다. 복습 목록에서만 제거되며 이전 채점 기록과 통계는 유지됩니다.

서술형·코드·SQL 문제는 답안 표현이 다양하므로 자기 채점 방식을 사용합니다. 별도의 생성형 AI API는 사용하지 않습니다.

## 매일 자동 출제

```text
매일 문제 5개 켜기
자동출제 확인
매일 문제 끄기
```

Cron Trigger는 매일 `00:00 UTC`, 한국 시간 오전 9시에 실행됩니다. 켜기를 입력한 사용자와 채널에만 문제를 보내며, `자동출제 확인`으로 현재 상태와 문제 개수를 확인할 수 있습니다.

## 문제은행 자동 검증

```bash
npm run check
```

타입 검사와 함께 150문제의 필수 필드, 문제 ID 중복, 유형·난이도 값, 보기형 선택지를 검사합니다. 같은 검사는 `.github/workflows/check.yml`을 통해 모든 `main` 푸시와 Pull Request에서 자동 실행됩니다.

## 자동 배포

`main` 브랜치에 커밋이 올라오면 Cloudflare Workers가 자동으로 빌드하고 배포합니다.

## 보안

- `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`는 Cloudflare Secrets로만 관리합니다.
- 로컬 비밀값은 `.dev.vars`에 저장하며 Git에 커밋하지 않습니다.
- 배포된 Worker의 `/test/command` 경로는 외부에서 사용할 수 없습니다.
- 토큰이 로그, 화면 공유 또는 저장소에 노출되면 즉시 Slack에서 폐기하고 Cloudflare 비밀값을 교체합니다.
