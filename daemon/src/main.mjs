import { readFileSync } from 'node:fs'
import { Contract } from './contract.mjs'
import { devStatus, statusRoute } from './status/dev-status.mjs'
import { pm2Rpc } from './status/pm2-rpc.mjs'
import { Port } from './status/port.mjs'
import { guard } from './server/guard.mjs'
import { keyring } from './token/keys.mjs'
import { output } from './output/output.mjs'
import { listen } from './server/server.mjs'
import { countStart } from './facts/count-start.mjs'
import { stats } from './facts/stats.mjs'
import { version } from './facts/version.mjs'
import { watch } from './watch/watch.mjs'

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
const starts = countStart()
const keys = keyring(Contract.KEYS)
const outputRoute = output({ path: Contract.OUTPUT, sandboxIdFile: Contract.SANDBOX_ID })
const devStatusRoute = statusRoute(devStatus({
  pm2: pm2Rpc({ bin: Contract.PM2_BIN, socket: Contract.PM2_RPC, timeout: 3000 }),
  probe: () => Port.isAnswering({ port: Contract.DEV_PORT, path: Contract.DEV_PROBE, timeout: 2000 }),
  holder: Port.holder(Contract.DEV_PORT),
  bootId: readFileSync(Contract.BOOT_ID, 'utf8').trim(),
}, { poll: 1000, waiting: 500, listening: 2000, linger: 10_000 }))
const watchRoute = watch({ root: Contract.WATCH_ROOT, sandboxIdFile: Contract.SANDBOX_ID, bootIdFile: Contract.BOOT_ID, starts })

process.on('SIGHUP', keys.reload)

listen(Contract.SOCKET, { routes: { '/version': version(manifest), '/stats': stats({ build: manifest.build, starts }), '/output': outputRoute, '/status': devStatusRoute, '/watch': watchRoute }, guard: null, origins: [] })
listen(Contract.PORT, { routes: { '/version': version(manifest), '/output': outputRoute, '/status': devStatusRoute, '/watch': watchRoute }, guard: guard({ keyring: keys, sandboxIdFile: Contract.SANDBOX_ID }), origins: Contract.ORIGINS })
