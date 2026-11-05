import { readFileSync } from 'node:fs'
import { KEYS, ORIGINS, OUTPUT, PORT, SANDBOX_ID, SOCKET } from './contract.mjs'
import { guard } from './guard.mjs'
import { keyring } from './keys.mjs'
import { output } from './output.mjs'
import { listen } from './server.mjs'
import { countStart } from './starts.mjs'
import { stats } from './stats.mjs'
import { version } from './version.mjs'

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
const starts = countStart()
const keys = keyring(KEYS)
const outputRoute = output({ path: OUTPUT, sandboxIdFile: SANDBOX_ID })

process.on('SIGHUP', keys.reload)

listen(SOCKET, { routes: { '/version': version(manifest), '/stats': stats({ build: manifest.build, starts }), '/output': outputRoute }, guard: null, origins: [] })
listen(PORT, { routes: { '/version': version(manifest), '/output': outputRoute }, guard: guard({ keyring: keys, sandboxIdFile: SANDBOX_ID }), origins: ORIGINS })
