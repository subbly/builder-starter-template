#!/bin/sh
set -eu

count=100

while getopts n: option; do
  case $option in
    n) count=$OPTARG ;;
    *) echo 'usage: dev-log.sh [-n records]' >&2; exit 2 ;;
  esac
done

logs=/project/workspace/.subbly/logs
archive=$(ls -1 "$logs"/output__*.log 2> /dev/null | tail -n 1)

cat $archive "$logs/output.log" 2> /dev/null | tail -n "$count" | jq -Rr '
  ((fromjson? | select(type == "object" and (.message | type) == "string")) // { message: (. + "\n"), timestamp: "-", type: "out" })
  | . as $record
  | .message
  | gsub("\u001b\\[[0-9;?]*[ -/]*[@-~]"; "")
  | gsub("\r\n"; "\n")
  | (if endswith("\n") then .[:-1] else . end)
  | split("\n")[]
  | "\($record.timestamp) \($record.type) \(.)"
'
