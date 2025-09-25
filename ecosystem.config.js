module.exports = {
  apps: [
    {
      name: 'subbly-dev',
      script: 'pnpm',
      args: 'run dev',
      cwd: './',
      interpreter: 'none',
      watch: ['src/**/*.css', 'src/**/*.scss', 'pnpm-lock.yaml'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', '.git', '.next', '.subbly/logs'],
      autorestart: false,
      log_file: './.subbly/logs/output.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DDTHH:mm:ss.SSS',
      instances: 1,
      env: {
        FORCE_COLOR: '1',
        TERM: 'xterm-256color',
      },
    },
  ],
}
