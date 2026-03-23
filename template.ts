import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromImage('node:22-slim')
  .setUser('root')
  .runCmd(
    'apt-get update && apt-get install -y git curl lsof ripgrep jq && rm -rf /var/lib/apt/lists/*'
  )
  .runCmd('npm install -g netlify-cli pnpm chokidar-cli pm2')
  .copy('main', '/project/workspace/main')
  .copy('store-actions/lib', '/project/workspace/store-actions/lib')
  .copy('store-actions/scripts', '/project/workspace/store-actions/scripts')
  .copy('store-actions/package.json', '/project/workspace/store-actions/package.json')
  .copy('store-actions/pnpm-lock.yaml', '/project/workspace/store-actions/pnpm-lock.yaml')
  .copy('.subbly', '/project/workspace/.subbly')
  .copy('skills', '/project/workspace/skills')
  .copy('ecosystem.config.js', '/project/workspace/ecosystem.config.js')
  .runCmd('cd /project/workspace/main && pnpm install --dangerously-allow-all-builds')
  .runCmd('cd /project/workspace/store-actions && pnpm install --dangerously-allow-all-builds')
  .runCmd('chown -R user:user /project/workspace')
  .setUser('user')
  .runCmd(
    'pm2 install pm2-logrotate && ' +
    'pm2 set pm2-logrotate:max_size 5M && ' +
    'pm2 set pm2-logrotate:retain 2 && ' +
    'pm2 set pm2-logrotate:compress true && ' +
    'pm2 set pm2-logrotate:workerInterval 30 && ' +
    'pm2 kill'
  )
  .setWorkdir('/project/workspace/main')
  .setStartCmd('pm2 start /project/workspace/ecosystem.config.js --no-daemon', waitForPort(3000))
