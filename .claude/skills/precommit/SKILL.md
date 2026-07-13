---
name: precommit
description: 커밋 전 점검 흐름. 검증 실행 -> 문제 있으면 자동 수정 후 재검증 -> 차단 문제는 보고 -> 항상 마지막에 커밋 메시지 추천까지 진행한다.
disable-model-invocation: true
allowed-tools: Bash(npm run *), Bash(git *), Read, Grep, Glob, Edit
---

## 현재 변경 사항

!`git status --short`

!`git diff --stat`

## 절차

1. **검증 실행**: `npm run check` (typecheck + validate:questions)를 실행하고 결과를 그대로 보여준다.

2. **실패한 경우**:
   - 타입 에러, 문제은행 스키마 위반(필수 필드 누락, id 중복, kind/difficulty 오타 등)처럼 **기계적이고 정답이 명확한 문제**는 바로 고치고 1번부터 다시 검증한다. 통과할 때까지 반복한다.
   - 마이그레이션 설계, 아키텍처 트레이드오프처럼 **여러 선택지 중 사용자가 골라야 하는 문제**는 자동으로 고치지 말고 설명 후 물어본다. 이 경우에만 6번(커밋 메시지 추천)을 생략한다.

3. **검증 통과 후 리뷰**: 변경된 파일 종류에 따라 관련 서브에이전트의 체크리스트 기준으로 직접 검토한다.
   - `src/question-bank/` 변경 → `.claude/agents/question-bank-reviewer.md` 기준(표절 의심, hint 답 노출, confusion 실질성, id 접두사 규칙)
   - `src/`(question-bank 제외) 변경 → `.claude/agents/code-reviewer.md` 기준(Slack 서명 검증, D1 파라미터 바인딩, 에러 처리)
   - `migrations/` 변경 → `.claude/agents/db-migration-helper.md` 기준(기존 파일 불변성, SQLite 제약)

4. **리뷰 결과를 반드시 둘 중 하나로 분류한다** (애매하게 끝내지 않는다):
   - **차단(BLOCK)**: 표절이 확정적이거나, 답이 틀렸거나, 반드시 고쳐야 하는 문제. 이 경우에만 자동으로 넘어가지 않고 보고 후 사용자 확인을 받으며, 6번을 생략한다.
   - **통과(PASS)**: 확정적인 문제는 없고 "이런 패턴이 흔하니 참고하라"는 수준의 경고만 있는 경우. 이건 차단이 아니다 — 요약에 참고 코멘트로 남기되, 반드시 6번(커밋 메시지 추천)까지 계속 진행한다.

5. 리뷰 요약을 출력한다 (통과/차단 여부, 발견한 참고 사항 포함).

6. **차단이 아니면 이 단계를 절대 생략하지 않는다.** `git status --short`, `git diff --stat` 기준으로 변경 성격을 파악해 `CLAUDE.md`의 커밋 컨벤션(한국어, `<type>: <설명>`, 기존 타입: feat/docs/chore)에 맞는 커밋 메시지를 코드 블록으로 추천하며 답변을 마무리한다. 성격이 다른 변경(예: 툴링 설정 vs 콘텐츠 추가)이 섞여 있으면 나누어 커밋하도록 각각 메시지를 제안한다. 리뷰가 아무리 길어져도 이 단계 없이 응답을 끝내면 안 된다.

**절대 `git commit`을 직접 실행하지 않는다.** 메시지만 추천하고, 실제 커밋은 사용자가 한다.
