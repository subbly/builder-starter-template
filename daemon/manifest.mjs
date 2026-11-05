// Writes daemon/bundle/manifest.json: the build is a hash of every shipped file, the protocol changes only on a contract break.
// usage: node daemon/manifest.mjs [--check] [--protocol <n>]
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { check: { type: 'boolean' }, protocol: { type: 'string' } } })
const bundle = new URL('./bundle/', import.meta.url)
const path = new URL('manifest.json', bundle)
const committed = JSON.parse(readFileSync(path, 'utf8'))
const hash = createHash('sha256')

for (const name of readdirSync(bundle).filter((name) => name !== 'manifest.json').sort()) {
  hash.update(`${name}\0`).update(readFileSync(new URL(name, bundle))).update('\0')
}

const manifest = { build: hash.digest('hex').slice(0, 12), protocol: values.protocol ? Number(values.protocol) : committed.protocol }

if (values.check) {
  if (manifest.build !== committed.build || manifest.protocol !== committed.protocol) {
    console.error(`daemon/bundle/manifest.json says ${JSON.stringify(committed)}, the files are ${JSON.stringify(manifest)}. Run node daemon/manifest.mjs and commit it.`)
    process.exit(1)
  }
} else {
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest))
}
