#!/bin/bash
# src/, scripts/ 아래 파일이 수정되면 npm run check(typecheck + validate:questions)를 자동 실행한다.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

case "$FILE_PATH" in
  *src/*|*scripts/*)
    cd "$CLAUDE_PROJECT_DIR" || exit 0
    OUTPUT=$(npm run check 2>&1)
    STATUS=$?
    if [[ $STATUS -ne 0 ]]; then
      echo "npm run check 실패 ($FILE_PATH 수정 후):" >&2
      echo "$OUTPUT" >&2
      exit 2
    fi
    ;;
esac

exit 0
