import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { RECORD_BYTES, record } from './record.mjs'

const written = readFileSync(new URL('./pm2-records.jsonl', import.meta.url)).toString('utf8').split('\n').filter(Boolean).map((line) => Buffer.from(line))
const parsed = (raw) => record(raw, raw.length)

test('a pm2 JSON line is one record with its text, timestamp and stream', () => {
  assert.deepEqual(parsed(written[0]), { ts: Date.parse('2026-11-05T20:09:32.355Z'), stream: 'out', text: 'one line\n' })
})

test('a write of several lines stays one record', () => {
  assert.equal(parsed(written[1]).text, 'first of two\nsecond of two\n')
  assert.equal(parsed(written[5]).text, 'probe log line one\nprobe log line two\n')
})

test('a partial line is its own record, without a newline, and its rest is the next one', () => {
  assert.equal(parsed(written[2]).text, 'PARTIAL start ... ')
  assert.match(parsed(written[4]).text, /^completed later\n/)
})

test('stderr writes carry the err stream', () => {
  assert.deepEqual(written.map((raw) => parsed(raw).stream), ['out', 'out', 'out', 'err', 'out', 'out', 'out', 'err', 'err', 'out', 'err', 'out'])
})

test('ANSI, tabs, quotes, backslashes and CRLF come back as written', () => {
  assert.equal(parsed(written[4]).text, 'completed later\n\u001b[32mgreen\u001b[0m and tab\t and quote " and backslash \\ \ncrlf line\r\n')
})

test('an error with its code frame is one record, apart from the request line after it', () => {
  const error = parsed(written[10])
  const request = parsed(written[11])

  assert.match(error.text, /Error: probe route handler failed\n {4}at GET/)
  assert.ok(error.text.split('\n').length > 5)
  assert.match(request.text, /^ GET \/api\/zz-throw/)
})

test('a line that is not a pm2 record is a record of its own text', () => {
  assert.deepEqual(parsed(Buffer.from('2026-11-05T12:00:00.000: plain')), { ts: null, stream: 'out', text: '2026-11-05T12:00:00.000: plain\n' })
  assert.deepEqual(parsed(Buffer.from('{"message":7}')), { ts: null, stream: 'out', text: '{"message":7}\n' })
})

test('a record over the cap is cut and marked', () => {
  const raw = Buffer.from(JSON.stringify({ message: `${'é'.repeat(RECORD_BYTES)}\n`, timestamp: '2026-11-05T20:09:32.355Z', type: 'err' }))
  const cut = parsed(raw)

  assert.equal(cut.truncated, true)
  assert.equal(cut.stream, 'err')
  assert.ok(Buffer.byteLength(cut.text) <= RECORD_BYTES)
})

test('a line read only in part is cut and marked', () => {
  const cut = record(Buffer.from('{"message":"xxxx'), 1_000_000)

  assert.equal(cut.truncated, true)
  assert.equal(cut.text, '{"message":"xxxx')
})
