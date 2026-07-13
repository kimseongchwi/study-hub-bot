# Study Hub Bot

Slack에서 정보처리기사·SQLD 등 자격증 복습 문제를 풀 수 있는 Cloudflare Worker 봇.

## 스택

- Cloudflare Workers + Wrangler, TypeScript
- D1 (SQLite 기반) - 사용자별 정답/오답, 복습 주기, 자동 출제 기록 저장
- Slack 이벤트 API로 명령어 처리 (`src/index.ts`)

## 자주 쓰는 명령어

```bash
npm run dev                # 로컬 개발 서버 (wrangler dev)
npm run typecheck          # tsc --noEmit
npm run validate:questions # 문제은행 스키마/중복 검증
npm run check              # typecheck + validate:questions, 커밋 전 항상 실행
npm run db:migrate:local   # D1 로컬 마이그레이션 적용
npm run db:migrate:remote  # D1 원격 마이그레이션 적용
```

작업을 "완료"로 보고하기 전에 항상 `npm run check`를 통과시킨다.

## 문제은행 구조 (`src/question-bank/`)

- `types.ts`: 전 자격증 공통 `StudyQuestion` 타입. 새 필드 추가 시 하위 호환 깨지지 않게 optional로.
- `index.ts`: 자격증 ID(`CertificationId`)와 문제은행을 연결
- 자격증별 폴더(`정보처리기사/`, `SQLD/`) 안에 영역별 파일, 각 폴더의 `index.ts`가 배열을 합침
- 새 자격증 추가 시 같은 패턴으로 폴더 생성 (`src/question-bank/README.md` 참고)

문제 작성 규칙:
- `id`는 자격증·영역 접두사로 전체 유일성 보장 (예: `sqld-select-01`)
- `hint`는 정답을 직접 드러내지 않기
- **실제 기출문장을 그대로 복제하지 않는다** — 개념은 같아도 문장은 새로 작성
- 문제 추가/수정 후 반드시 `npm run validate:questions` 통과 확인

## 커밋 컨벤션

한국어 커밋 메시지, `<type>: <설명>` 형식. 기존 로그에서 쓰이는 타입: `feat`, `docs`, `chore`.

## D1 마이그레이션

- `migrations/` 폴더에 순번이 붙은 SQL 파일 (`0001_learning.sql` 형식)
- 새 마이그레이션은 항상 새 번호로 추가, 기존 파일은 수정하지 않음 (이미 배포된 스키마 변경 이력이므로)
- 로컬에서 `db:migrate:local`로 먼저 검증 후 `db:migrate:remote` 안내

## 절대 하지 말 것

- `package-lock.json` 수동 편집
- 이미 적용된 `migrations/*.sql` 파일 내용 변경 (새 마이그레이션으로 대응)
- 실제 기출문제 문장을 그대로 베껴 문제은행에 추가
