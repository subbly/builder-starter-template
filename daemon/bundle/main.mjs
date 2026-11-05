import { readFileSync } from 'node:fs'
import { BOOT_ID, KEYS, ORIGINS, OUTPUT, PORT, SANDBOX_ID, SOCKET, WATCH_ROOT } from './contract.mjs'
import { sandboxDevStatus, statusRoute } from './dev-status.mjs'
import { guard } from './guard.mjs'
import { keyring } from './keys.mjs'
import { output } from './output.mjs'
import { listen } from './server.mjs'
import { countStart } from './starts.mjs'
import { stats } from './stats.mjs'
import { version } from './version.mjs'
import { watch } from './watch.mjs'

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
const starts = countStart()
const keys = keyring(KEYS)
const outputRoute = output({ path: OUTPUT, sandboxIdFile: SANDBOX_ID })
const devStatusRoute = statusRoute(sandboxDevStatus())
const watchRoute = watch({ root: WATCH_ROOT, sandboxIdFile: SANDBOX_ID, bootIdFile: BOOT_ID, starts })

process.on('SIGHUP', keys.reload)

listen(SOCKET, { routes: { '/version': version(manifest), '/stats': stats({ build: manifest.build, starts }), '/output': outputRoute, '/status': devStatusRoute, '/watch': watchRoute }, guard: null, origins: [] })
listen(PORT, { routes: { '/version': version(manifest), '/output': outputRoute, '/status': devStatusRoute, '/watch': watchRoute }, guard: guard({ keyring: keys, sandboxIdFile: SANDBOX_ID }), origins: ORIGINS })
