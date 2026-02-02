module.exports = {
  apps: [
    {
      name: 'subbly-dev',
      script: 'pnpm',
      args: 'run dev',
      cwd: '/project/workspace/main',
      interpreter: 'none',
      watch: ['src/**/*.css', 'src/**/*.scss', './pnpm-lock.yaml'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', '.git', '.next', '.subbly'],
      exp_backoff_restart_delay: 1000,
      log_file: '/project/workspace/main/.subbly/logs/output.log',
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
