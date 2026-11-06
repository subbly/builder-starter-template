export * as Contract from './contract.mjs'

export const PORT = 29170
export const SOCKET = '/run/subbly/daemon.sock'
export const KEYS = '/etc/subbly/daemon-keys.json'
export const SANDBOX_ID = '/run/e2b/.E2B_SANDBOX_ID'
export const OUTPUT = '/project/workspace/.subbly/logs/output.log'
export const ORIGINS = [
  'https://builder.subbly.co',
  'https://staging-vibe.subbly.io',
  'https://builder.subbly.test',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]
export const PM2_BIN = '/usr/local/bin/pm2'
export const PM2_RPC = '/home/user/.pm2/rpc.sock'
export const BOOT_ID = '/proc/sys/kernel/random/boot_id'
export const DEV_APP = 'subbly-dev'
export const DEV_PORT = 3000
export const DEV_PROBE = '/__nextjs_original-stack-frames'
export const WATCH_ROOT = '/project/workspace/main'
