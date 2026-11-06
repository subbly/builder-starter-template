import assert from 'node:assert/strict'
import { appendFileSync, copyFileSync, mkdtempSync, rmSync, truncateSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { OutputLog } from './output-log.mjs'

const SANDBOX = 'itestsandbox000000001'

const logFile = () => join(mkdtempSync(join(tmpdir(), 'daemon-output-')), 'output.log')

const pm2Line = (message, type = 'out') => `${JSON.stringify({ message, timestamp: '2026-11-05T12:00:00.250Z', type, process_id: 1, app_name: 'subbly-dev' })}\n`

const lines = (from, to, text = 'line') => Array.from({ length: to - from + 1 }, (_, index) => pm2Line(`${text} ${from + index}\n`)).join('')

let rotations = 0

const rotate = (path) => {
  rotations += 1
  copyFileSync(path, path.replace(/\.log$/, `__2026-11-05_12-00-${String(rotations).padStart(2, '0')}.log`))
  truncateSync(path, 0)
}

const cursorAfter = (path, count) => {
  const text = lines(1, count)
  const offset = Buffer.byteLength(text)
  const files = OutputLog.segments(path, SANDBOX)

  return { epoch: files.at(-1).epoch, offset, check: OutputLog.check(path, offset) }
}

const texts = (path, at) => {
  const seen = []
  let current = at

  for (;;) {
    const files = OutputLog.segments(path, SANDBOX)
    const found = OutputLog.location({ at: current, files, behindBytes: Infinity })

    assert.equal(found.reset, undefined)

    const chunk = OutputLog.chunk(files[found.index], found.offset)

    if (chunk.records.length > 0) {
      seen.push(...chunk.records.map((record) => record.text.replace(/\n$/, '')))
      current = { epoch: files[found.index].epoch, offset: chunk.offset, check: chunk.check }
      continue
    }

    if (found.index === files.length - 1) {
      return seen
    }

    current = { epoch: files[found.index + 1].epoch, offset: 0, check: '0' }
  }
}

test('a cursor in the current file resumes after its last line', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 10)
  appendFileSync(path, lines(11, 12))

  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { index: 0, offset: at.offset })
  assert.deepEqual(texts(path, at), ['line 11', 'line 12'])
})

test('a cursor in a rotated file reads on from its archive into the new file', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 5)
  rotate(path)
  appendFileSync(path, lines(11, 12))

  assert.equal(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }).index, 0)
  assert.deepEqual(texts(path, at), ['line 6', 'line 7', 'line 8', 'line 9', 'line 10', 'line 11', 'line 12'])
})

test('a cursor two rotations back reads through both archives', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 4))
  const at = cursorAfter(path, 2)
  rotate(path)
  appendFileSync(path, lines(5, 6))
  rotate(path)
  appendFileSync(path, lines(7, 8))

  assert.deepEqual(texts(path, at), ['line 3', 'line 4', 'line 5', 'line 6', 'line 7', 'line 8'])
})

test('a cursor at the end of an archive moves on to the next file without a reset', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 3))
  const at = cursorAfter(path, 3)
  rotate(path)
  appendFileSync(path, lines(4, 4))

  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { index: 1, offset: 0 })
})

test('an empty file has no epoch yet, and its cursor starts from byte 0 once lines arrive', () => {
  const path = logFile()

  writeFileSync(path, '')
  const files = OutputLog.segments(path, SANDBOX)

  assert.equal(files.at(-1).epoch, 'none')

  const at = OutputLog.position(OutputLog.cursor({ epoch: 'none', offset: 0, check: '0' }))
  appendFileSync(path, lines(1, 2))

  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { index: 0, offset: 0 })
  assert.deepEqual(texts(path, at), ['line 1', 'line 2'])
})

test('a partial first line is not an epoch yet', () => {
  const path = logFile()

  writeFileSync(path, pm2Line('no newline yet').trimEnd())

  assert.equal(OutputLog.segments(path, SANDBOX).at(-1).epoch, 'none')
})

test('the epoch binds the sandbox id', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 2))

  assert.notEqual(OutputLog.segments(path, SANDBOX).at(-1).epoch, OutputLog.segments(path, 'iothersandbox00000002').at(-1).epoch)
})

test('a cursor whose file is gone from every archive gets a rotated reset', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 2))
  const at = cursorAfter(path, 1)
  rotate(path)
  appendFileSync(path, lines(3, 3))
  rotate(path)
  appendFileSync(path, lines(4, 4))
  rmSync(OutputLog.segments(path, SANDBOX)[0].path)

  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'rotated' })
})

test('a cursor past the end of its file gets a truncated reset', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 10)
  writeFileSync(path, lines(1, 3))

  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'truncated' })
})

test('a rollback that regrows the file under the same first line fails the check and resets', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 8)
  writeFileSync(path, lines(1, 5) + lines(6, 20, 'after the cold boot'))

  assert.ok(OutputLog.segments(path, SANDBOX).at(-1).size > at.offset)
  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'truncated' })
})

test('a cursor that is not on a line boundary resets', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 5)

  assert.deepEqual(OutputLog.location({ at: { ...at, offset: at.offset - 3 }, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'truncated' })
})

test('a cursor the daemon cannot read gets an unknown reset', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 2))

  assert.equal(OutputLog.position('not-a-cursor'), null)
  assert.deepEqual(OutputLog.location({ at: OutputLog.position('not-a-cursor'), files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'unknown' })
  assert.deepEqual(OutputLog.location({ at: OutputLog.position('0123456789abcdef.10.0123456789abcdef'), files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'unknown' })
})

test('a cursor a 10,000-line flood left behind resumes without a reset', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 10)
  appendFileSync(path, Array.from({ length: 500 }, (_, record) => pm2Line(Array.from({ length: 20 }, (_, line) => `FLOOD cutflood12345 ${record * 20 + line} \n`).join(''))).join(''))

  assert.ok(OutputLog.segments(path, SANDBOX).at(-1).size - at.offset > 256 * 1024)
  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { index: 0, offset: at.offset })
})

test('a cursor more than 1 MiB behind gets a behind reset', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 10))
  const at = cursorAfter(path, 10)
  appendFileSync(path, lines(11, 8000, 'x'.repeat(100)))

  assert.ok(OutputLog.segments(path, SANDBOX).at(-1).size - at.offset > 1024 * 1024)
  assert.deepEqual(OutputLog.location({ at, files: OutputLog.segments(path, SANDBOX), behindBytes: OutputLog.BEHIND_BYTES }), { reset: 'behind' })
})

test('a first attach replays the last 64 KiB from a line boundary, across an archive', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 2000, 'x'.repeat(40)))
  rotate(path)
  appendFileSync(path, lines(2001, 2010))

  const files = OutputLog.segments(path, SANDBOX)
  const start = OutputLog.tail(files, OutputLog.REPLAY_BYTES)
  const replayed = texts(path, { epoch: files[start.index].epoch, offset: start.offset, check: OutputLog.check(files[start.index].path, start.offset) })
  const bytes = files.slice(start.index).reduce((sum, file) => sum + file.size, 0) - start.offset

  assert.equal(start.index, 0)
  assert.ok(bytes <= OutputLog.REPLAY_BYTES && bytes > OutputLog.REPLAY_BYTES - 200)
  assert.equal(replayed.at(-1), 'line 2010')
  assert.match(replayed[0], /^x+ \d+$/)
})

test('a frame holds whole records, and a line longer than a read is read whole', () => {
  const path = logFile()
  const long = pm2Line(`${'y'.repeat(100_000)}\n`, 'err')

  writeFileSync(path, `${pm2Line('\u001b[32mready\u001b[39m\n')}${long}${pm2Line('partial')}`)
  const file = OutputLog.segments(path, SANDBOX).at(-1)
  const first = OutputLog.chunk(file, 0)
  const second = OutputLog.chunk(file, first.offset)

  assert.deepEqual(first.records, [{ ts: Date.parse('2026-11-05T12:00:00.250Z'), stream: 'out', text: '\u001b[32mready\u001b[39m\n' }])
  assert.deepEqual(second.records, [{ ts: Date.parse('2026-11-05T12:00:00.250Z'), stream: 'err', text: `${'y'.repeat(100_000)}\n` }])
  assert.equal(second.offset, Buffer.byteLength(pm2Line('\u001b[32mready\u001b[39m\n') + long))
  assert.deepEqual(OutputLog.chunk(file, second.offset).records.map((record) => record.text), ['partial'])
})

test('a line longer than the read limit is cut, and the cursor moves past all of it', () => {
  const path = logFile()

  writeFileSync(path, `${'z'.repeat(2_000_000)}\n${pm2Line('next\n')}`)
  const first = OutputLog.chunk(OutputLog.segments(path, SANDBOX).at(-1), 0)

  assert.equal(first.records.length, 1)
  assert.equal(first.records[0].truncated, true)
  assert.equal(first.offset, 2_000_001)
  assert.deepEqual(OutputLog.chunk(OutputLog.segments(path, SANDBOX).at(-1), first.offset).records.map((record) => record.text), ['next\n'])
})

test('a frame holds at most 256 records', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 600))

  assert.equal(OutputLog.chunk(OutputLog.segments(path, SANDBOX).at(-1), 0).records.length, 256)
})

test('the cursor a frame issues verifies on the next attach', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 600))
  const files = OutputLog.segments(path, SANDBOX)
  const chunk = OutputLog.chunk(files.at(-1), 0)
  const at = OutputLog.position(OutputLog.cursor({ epoch: files.at(-1).epoch, offset: chunk.offset, check: chunk.check }))

  assert.deepEqual(OutputLog.location({ at, files, behindBytes: OutputLog.BEHIND_BYTES }), { index: 0, offset: chunk.offset })
})

test('a catch-up reads through one buffer, so a burst leaves no native memory waiting for a full collection', () => {
  const path = logFile()

  writeFileSync(path, lines(1, 5000, 'archived'))
  rotate(path)
  writeFileSync(path, `${lines(1, 5000)}${pm2Line(`${'w'.repeat(70_000)}\n`)}${lines(5001, 6000)}`)

  const files = OutputLog.segments(path, SANDBOX)
  let at = { epoch: files[0].epoch, offset: 0, check: '0' }
  let reads = 0

  for (;;) {
    const before = process.memoryUsage().arrayBuffers
    const current = OutputLog.segments(path, SANDBOX)
    const found = OutputLog.location({ at, files: current, behindBytes: Infinity })
    const chunk = OutputLog.chunk(current[found.index], found.offset)

    assert.ok(process.memoryUsage().arrayBuffers <= before, `read ${reads} left ${process.memoryUsage().arrayBuffers - before} bytes of buffers`)
    reads += 1

    if (chunk.records.length > 0) {
      at = { epoch: current[found.index].epoch, offset: chunk.offset, check: chunk.check }
      continue
    }

    if (found.index === current.length - 1) {
      break
    }

    at = { epoch: current[found.index + 1].epoch, offset: 0, check: '0' }
  }

  assert.ok(reads > 40)
})
