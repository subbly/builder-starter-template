import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { chunker, snapshot } from '../bundle/snapshot.mjs'

const root = mkdtempSync(join(tmpdir(), 'daemon-snapshot-'))

after(() => rmSync(root, { recursive: true, force: true }))

const tree = (base, files) => {
  for (const file of files) {
    if (file.endsWith('/')) {
      mkdirSync(join(base, file), { recursive: true })
    } else {
      mkdirSync(join(base, file, '..'), { recursive: true })
      writeFileSync(join(base, file), 'x')
    }
  }
}

const collect = async (dir, caps) => {
  const chunks = []

  for await (const chunk of snapshot(dir, caps)) {
    chunks.push(chunk)
  }

  return chunks
}

test('the snapshot walks the disk, skips never-watched and never-reported trees, and never follows a link', async () => {
  const project = join(root, 'project')

  tree(project, ['package.json', '.gitignore', 'src/app/page.tsx', 'src/app/layout.tsx', 'src/lib/env.ts', 'public/', '.env', '.env.local', 'certs/server.pem', 'certs/server.key', '.npmrc', 'node_modules/react/index.js', '.next/cache/x', '.git/HEAD', 'packages/ui/node_modules/x/index.js', 'packages/ui/.next/x', 'packages/ui/index.ts', '.env.d/values'])
  mkdirSync(join(project, 'empty'))
  symlinkSync(join(project, 'src'), join(project, 'src-link'))

  const entries = (await collect(project)).flat()
  const byPath = new Map(entries.map((item) => [item.path, item.entry]))

  assert.equal(entries.length, byPath.size)
  assert.deepEqual(Object.fromEntries([...byPath].sort()), {
    '.gitignore': 'file',
    certs: 'directory',
    empty: 'directory',
    'package.json': 'file',
    packages: 'directory',
    'packages/ui': 'directory',
    'packages/ui/index.ts': 'file',
    public: 'directory',
    src: 'directory',
    'src-link': 'file',
    'src/app': 'directory',
    'src/app/layout.tsx': 'file',
    'src/app/page.tsx': 'file',
    'src/lib': 'directory',
    'src/lib/env.ts': 'file',
  })

  const order = entries.map((item) => item.path)

  for (const { path } of entries.filter((item) => item.path.includes('/'))) {
    assert.ok(order.indexOf(path.slice(0, path.lastIndexOf('/'))) < order.indexOf(path), `${path} comes after its directory`)
  }
})

test('the snapshot comes in chunks under the entry and byte caps', async () => {
  const project = join(root, 'chunks')

  tree(project, Array.from({ length: 250 }, (_, i) => `dir-${i % 5}/file-${i}.ts`))

  const byCount = await collect(project, { maxEntries: 40, maxBytes: 1024 * 1024 })

  assert.equal(byCount.flat().length, 255)
  assert.ok(byCount.slice(0, -1).every((chunk) => chunk.length === 40))
  assert.ok(byCount.at(-1).length <= 40)

  const byBytes = await collect(project, { maxEntries: 10_000, maxBytes: 2048 })

  assert.equal(byBytes.flat().length, 255)
  assert.ok(byBytes.length > 1)

  for (const chunk of byBytes) {
    assert.ok(chunk.reduce((bytes, item) => bytes + Buffer.byteLength(item.path) + 32, 0) < 2048 + 64)
  }
})

test('a missing root gives an empty snapshot', async () => {
  assert.deepEqual(await collect(join(root, 'missing')), [])
})

test('the chunker hands back a full chunk at either cap, and the rest on flush', () => {
  const chunk = chunker({ maxEntries: 2, maxBytes: 1000 })

  assert.equal(chunk.push({ path: 'a', entry: 'file' }), null)
  assert.deepEqual(chunk.push({ path: 'b', entry: 'file' }), [{ path: 'a', entry: 'file' }, { path: 'b', entry: 'file' }])
  assert.equal(chunk.flush(), null)

  const bytes = chunker({ maxEntries: 100, maxBytes: 64 })

  assert.equal(bytes.push({ path: 'x'.repeat(10), entry: 'file' }), null)
  assert.equal(bytes.push({ path: 'y'.repeat(30), entry: 'file' }).length, 2)
  assert.equal(bytes.push({ path: 'z', entry: 'directory' }), null)
  assert.deepEqual(bytes.flush(), [{ path: 'z', entry: 'directory' }])
})
