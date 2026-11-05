import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { check: { type: 'boolean' }, protocol: { type: 'string' } } })
const daemon = fileURLToPath(new URL('./', import.meta.url))
const path = join(daemon, 'src/manifest.json')
const committed = JSON.parse(readFileSync(path, 'utf8'))
const hash = createHash('sha256')
const isShipped = (name) => !name.startsWith('src/') || (name.endsWith('.mjs') && !name.endsWith('.test.mjs'))
const shipped = ['install', 'src', 'vendor']
  .flatMap((folder) => readdirSync(join(daemon, folder), { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => relative(daemon, join(entry.parentPath, entry.name)))
  .filter(isShipped)
  .sort()

for (const name of shipped) {
  hash.update(`${name}\0`).update(readFileSync(join(daemon, name))).update('\0')
}

const manifest = { build: hash.digest('hex').slice(0, 12), protocol: values.protocol ? Number(values.protocol) : committed.protocol }

if (values.check) {
  if (manifest.build !== committed.build || manifest.protocol !== committed.protocol) {
    console.error(`daemon/src/manifest.json says ${JSON.stringify(committed)}, the files are ${JSON.stringify(manifest)}. Run node daemon/manifest.mjs and commit it.`)
    process.exit(1)
  }
} else {
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest))
}
