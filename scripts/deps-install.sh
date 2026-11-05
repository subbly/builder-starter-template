#!/bin/bash
source /project/workspace/scripts/pm2-running.sh
cd /project/workspace/main || exit 0

current=$(cat package.json pnpm-lock.yaml 2>/dev/null | md5sum | cut -d' ' -f1)
stored=$(cat /project/workspace/.subbly/deps-hash 2>/dev/null)

if [ "$current" = "$stored" ]; then
  exit 0
fi

pnpm install --dangerously-allow-all-builds --no-frozen-lockfile || exit 1
echo "$current" > /project/workspace/.subbly/deps-hash

if ! pm2_running; then
  echo "[deps-install] pm2 is not running, subbly-dev not restarted"
  exit 0
fi

pm2 restart subbly-dev
