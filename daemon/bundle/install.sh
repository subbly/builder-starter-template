#!/bin/sh
set -eu

source=$(cd "$(dirname "$0")" && pwd)
target=/opt/subbly/daemon
build=$(node -p "require('$source/manifest.json').build")

mkdir -p "$target"
exec 9> "$target/.install.lock"
flock -w 120 9

mkdir -p "$target/$build"
cp "$source"/*.mjs "$source/manifest.json" "$target/$build/"
chmod 0755 "$target/$build"
chmod 0644 "$target/$build"/*
ln -sfn "$build" "$target/current.next"
mv -T "$target/current.next" "$target/current"

cp "$source/subbly-daemon.service" /etc/systemd/system/subbly-daemon.service
chmod 0644 /etc/systemd/system/subbly-daemon.service
systemctl enable subbly-daemon.service 2> /dev/null

if [ -d /run/systemd/system ]; then
  systemctl daemon-reload
  systemctl restart subbly-daemon.service
fi

find "$target" -mindepth 1 -maxdepth 1 -type d ! -name "$build" -exec rm -rf {} +
rm -rf "$source"
sync
