pm2_running() {
  pm2_pid=
  read -r pm2_pid 2>/dev/null < "${PM2_HOME:-$HOME/.pm2}/pm2.pid"
  grep -qs 'God Daemon' "/proc/$pm2_pid/cmdline"
}
