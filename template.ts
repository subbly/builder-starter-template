import { Template, ReadyCmd } from 'e2b'

const UV_VERSION = '0.12.10'
const PYTHON_VERSION = '3.13'
const NETLIFY_CLI_VERSION = '27.5.0'
const GLOBAL_PACKAGES = [
  `netlify-cli@${NETLIFY_CLI_VERSION}`,
  'pnpm',
  'chokidar-cli',
  'pm2',
  'shadcn',
  'tsx',
  'agent-browser',
]

export const createTemplate = () => {
  return Template()
    .fromImage('node:24-slim')
    .setUser('root')
    .runCmd(
      'apt-get update && apt-get install -y git curl lsof ripgrep jq unzip zip file poppler-utils python3 && rm -rf /var/lib/apt/lists/*'
    )
    .runCmd(
      `curl -LsSf https://astral.sh/uv/${UV_VERSION}/install.sh | env UV_INSTALL_DIR=/usr/local/bin UV_NO_MODIFY_PATH=1 sh`
    )
    .runCmd(`npm install -g ${GLOBAL_PACKAGES.join(' ')}`)
    .runCmd('HOME=/home/user agent-browser install --with-deps && chown -R user:user /home/user')
    .copy('main', '/project/workspace/main')
    .copy('.subbly', '/project/workspace/.subbly')
    .copy('scripts', '/project/workspace/scripts')
    .copy('ecosystem.config.js', '/project/workspace/ecosystem.config.js')
    .runCmd('chown -R user:user /project/workspace')
    .setUser('user')
    .runCmd(`uv python install ${PYTHON_VERSION}`)
    .runCmd('cd /project/workspace/main && pnpm install --dangerously-allow-all-builds')
    .runCmd(
      "cat /project/workspace/main/package.json /project/workspace/main/pnpm-lock.yaml | md5sum | cut -d' ' -f1 > /project/workspace/.subbly/deps-hash"
    )
    .runCmd(
      'pm2 install pm2-logrotate && ' +
      'pm2 set pm2-logrotate:max_size 5M && ' +
      'pm2 set pm2-logrotate:retain 2 && ' +
      'pm2 set pm2-logrotate:compress true && ' +
      'pm2 set pm2-logrotate:workerInterval 30 && ' +
      'pm2 kill'
    )
    .setWorkdir('/project/workspace/main')
    .setStartCmd('pm2 start /project/workspace/ecosystem.config.js --attach -s', readyWhenIdle())
}

const readyWhenIdle = () => {
  return new ReadyCmd('ss -tuln | grep -q :3000 && ! pgrep -f "pnpm insta[l]l"')
}
