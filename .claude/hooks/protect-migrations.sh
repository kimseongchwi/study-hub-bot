#!/bin/bash
# 이미 존재하는(=이미 배포됐을 수 있는) 마이그레이션 파일 수정을 막는다.
# 새 스키마 변경은 항상 새 번호의 파일로 추가해야 한다.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE_PATH" in
  */migrations/*.sql)
    echo "이미 존재하는 마이그레이션 파일은 수정하지 않습니다. 새 번호의 마이그레이션 파일을 추가하세요 (예: 0002_xxx.sql)." >&2
    exit 2
    ;;
esac

exit 0
