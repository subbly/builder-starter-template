#!/bin/sh
unset NODE_CHANNEL_FD NODE_CHANNEL_SERIALIZATION_MODE
. /project/workspace/scripts/pm2-running.sh
. /project/workspace/scripts/events.sh
cd /project/workspace/main || exit 1

open_events css-watcher -r -e close_write,moved_to,moved_from,delete --format '%w%f' --include '^\./src(/|$)' . @./node_modules @./.next @./.git @./.subbly

while read -r path <&9; do
  case $path in
    *.css | *.scss) ;;
    *) continue ;;
  esac

  settle

  if ! pm2_running; then
    echo "[css-watcher] $path changed, pm2 is not running, skipped"
    continue
  fi

  echo "[css-watcher] $path changed, clearing .next and restarting subbly-dev"
  rm -rf .next && pm2 restart subbly-dev < /dev/null
done
