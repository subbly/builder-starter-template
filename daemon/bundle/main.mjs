import { readFileSync } from 'node:fs'
import { KEYS, PORT, SANDBOX_ID, SOCKET } from './contract.mjs'
import { guard } from './guard.mjs'
import { keyring } from './keys.mjs'
import { listen } from './server.mjs'
import { countStart } from './starts.mjs'
import { stats } from './stats.mjs'
import { version } from './version.mjs'

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
const starts = countStart()
const keys = keyring(KEYS)

process.on('SIGHUP', keys.reload)

listen(SOCKET, { '/version': version(manifest), '/stats': stats({ build: manifest.build, starts }) }, null)
listen(PORT, { '/version': version(manifest) }, guard({ keyring: keys, sandboxIdFile: SANDBOX_ID }))
