import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const COUNTER = '/var/lib/subbly/daemon-starts'

export function countStart() {
  const previous = existsSync(COUNTER) ? Number(readFileSync(COUNTER, 'utf8')) : 0
  const starts = (Number.isInteger(previous) ? previous : 0) + 1

  writeFileSync(COUNTER, String(starts))

  return starts
}
