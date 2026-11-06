open_events() {
  events=/tmp/$1.events
  shift
  rm -f "$events"
  mkfifo "$events"
  inotifywait -m -q -o "$events" "$@" &
  watcher=$!
  trap 'kill "$watcher" 2>/dev/null' EXIT
  trap 'exit 130' INT TERM PIPE
  exec 9< "$events"
  rm "$events"
}

settle() {
  while timeout 1 sh -c 'read -r _' <&9; do :; done
}
