#!/bin/bash
# src/ 또는 migrations/에 아직 검토되지 않은 커밋 전 변경이 남아있으면
# 대화를 끝내기 전에 precommit 절차(검증 -> 리뷰 -> 커밋 메시지 추천)를 강제로 돌리게 한다.
# 같은 diff에 대해 한 번 돌고 나면 다시 반복해서 막지 않는다 (state 파일로 비교).

INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

# 이미 이번 턴에 한 번 블록해서 Claude가 이어서 작업 중이면 더 막지 않는다 (무한 루프 방지).
if [[ "$STOP_ACTIVE" == "true" ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 커밋 안 된 변경이 없으면 볼 것도 없음.
CHANGED=$(git status --porcelain -- src migrations 2>/dev/null)
if [[ -z "$CHANGED" ]]; then
  exit 0
fi

STATE_FILE=".claude/.precommit-state"
CURRENT_HASH=$(
  {
    git diff -- src migrations 2>/dev/null
    git status --porcelain -- src migrations 2>/dev/null
  } | git hash-object --stdin 2>/dev/null
)

if [[ -f "$STATE_FILE" ]] && [[ "$(cat "$STATE_FILE")" == "$CURRENT_HASH" ]]; then
  # 이 변경 내용은 이미 검토를 마쳤음 (사용자가 아직 커밋을 안 했을 뿐).
  exit 0
fi

echo "$CURRENT_HASH" > "$STATE_FILE"

echo "src/ 또는 migrations/에 아직 검토하지 않은 변경이 있습니다. 대화를 끝내기 전에 .claude/skills/precommit/SKILL.md의 절차를 그대로 따라서: 1) npm run check 실행, 2) 변경 종류에 맞는 서브에이전트 체크리스트로 리뷰, 3) 차단 사유가 없으면 CLAUDE.md 컨벤션에 맞는 커밋 메시지까지 반드시 추천하세요. git commit은 직접 실행하지 마세요." >&2
exit 2
