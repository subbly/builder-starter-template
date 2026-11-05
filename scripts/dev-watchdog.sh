#!/bin/bash
unset NODE_CHANNEL_FD NODE_CHANNEL_SERIALIZATION_MODE
source /project/workspace/scripts/pm2-running.sh
shopt -s nullglob

target=${WATCH_TARGET:-subbly-dev}
limit=${MEM_LIMIT_MB:-4500}
sustain=${SUSTAIN_S:-60}
interval=${INTERVAL_S:-20}
pids=${PM2_HOME:-$HOME/.pm2}/pids
over_since=
quiet_until=0

measure() {
  local -A parent pages tree=([$1]=1)
  local stat line pid fields grew=1

  for stat in /proc/[0-9]*/stat; do
    read -r line 2>/dev/null < "$stat" || continue
    pid=${line%% *}
    fields=(${line##*) })
    parent[$pid]=${fields[1]}
    pages[$pid]=${fields[21]}
  done

  while ((grew)); do
    grew=0
    for pid in "${!parent[@]}"; do
      if [[ -z ${tree[$pid]} && -n ${tree[${parent[$pid]}]} ]]; then
        tree[$pid]=1
        grew=1
      fi
    done
  done

  kb=0
  procs=0
  for pid in "${!tree[@]}"; do
    ((kb += ${pages[$pid]:-0} * 4, procs += 1))
  done
}

while sleep "$interval"; do
  root=
  for file in "$pids/$target"-*.pid; do
    read -r root 2>/dev/null < "$file"
  done

  if [[ -z $root || $root == 0 || ! -d /proc/$root ]]; then
    continue
  fi

  measure "$root"
  mb=$(((kb + 512) / 1024))
  now=$SECONDS

  if ((mb > limit)); then
    over_since=${over_since:-$now}
  else
    over_since=
  fi

  if [[ -z $over_since ]]; then
    echo "[dev-watchdog] $target tree $mb MB / $limit MB ($procs procs)"
    continue
  fi

  echo "[dev-watchdog] $target tree $mb MB / $limit MB ($procs procs), over $((now - over_since))s/${sustain}s"

  if ((now - over_since < sustain || now <= quiet_until)); then
    continue
  fi

  if ! pm2_running; then
    echo "[dev-watchdog] sustained over limit, pm2 is not running, skipped"
    continue
  fi

  echo "[dev-watchdog] sustained over limit, restarting $target"
  if pm2 restart "$target"; then
    quiet_until=$((now + 60))
    over_since=
  fi
done
