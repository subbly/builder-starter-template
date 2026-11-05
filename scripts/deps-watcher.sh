#!/bin/sh
unset NODE_CHANNEL_FD NODE_CHANNEL_SERIALIZATION_MODE
. /project/workspace/scripts/events.sh
cd /project/workspace/main || exit 1

open_events deps-watcher -e close_write,moved_to --format '%f' .

while read -r file <&9; do
  case $file in
    package.json | pnpm-lock.yaml) ;;
    *) continue ;;
  esac

  settle

  echo "[deps-watcher] $file changed, running deps-install.sh"
  bash /project/workspace/scripts/deps-install.sh < /dev/null
done
