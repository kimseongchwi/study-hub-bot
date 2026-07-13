#!/bin/bash
# package-lock.json은 npm install 계열 명령으로만 갱신되어야 하므로 직접 편집을 막는다.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *"package-lock.json" ]]; then
  echo "package-lock.json은 직접 편집하지 않습니다. npm install/npm update로 갱신하세요." >&2
  exit 2
fi

exit 0
