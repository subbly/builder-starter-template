export const RECORD_BYTES = 128 * 1024

export function record(raw, size) {
  const isWhole = raw.length === size
  const written = isWhole ? pm2Record(raw) : null
  const text = written ? written.text : `${raw.toString('utf8')}${isWhole ? '\n' : ''}`
  const isTruncated = !isWhole || Buffer.byteLength(text) > RECORD_BYTES

  return {
    ts: written ? written.ts : null,
    stream: written ? written.stream : 'out',
    text: isTruncated ? Buffer.from(text).subarray(0, RECORD_BYTES).toString('utf8') : text,
    ...(isTruncated ? { truncated: true } : {}),
  }
}

const pm2Record = (raw) => {
  try {
    const { message, timestamp, type } = JSON.parse(raw.toString('utf8'))
    const ts = Date.parse(timestamp)

    if (typeof message !== 'string') {
      return null
    }

    return { text: message, ts: Number.isNaN(ts) ? null : ts, stream: type === 'err' ? 'err' : 'out' }
  } catch {
    return null
  }
}
