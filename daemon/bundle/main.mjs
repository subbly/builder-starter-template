import { readFileSync } from 'node:fs'
import { PORT, SOCKET } from './contract.mjs'
import { listen } from './server.mjs'
import { countStart } from './starts.mjs'
import { stats } from './stats.mjs'
import { version } from './version.mjs'

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
const starts = countStart()

listen(SOCKET, { '/version': version(manifest), '/stats': stats({ build: manifest.build, starts }) })
listen(PORT, { '/version': version(manifest) })
