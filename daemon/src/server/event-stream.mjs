const HEARTBEAT_MS = 15_000

export function eventStream(response, claims) {
  let isOpen = true

  response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform' })
  response.write(': open\n\n')

  const send = (frame) => response.write(`data: ${JSON.stringify(frame)}\n\n`)

  const close = () => {
    isOpen = false
    clearInterval(heartbeat)
    clearTimeout(expiry)
    response.end()
  }

  const heartbeat = setInterval(() => send({ type: 'heartbeat' }), HEARTBEAT_MS)
  const expiry = claims
    ? setTimeout(() => {
      send({ type: 'expired' })
      close()
    }, Math.max(0, claims.exp * 1000 - Date.now()))
    : undefined

  response.on('close', () => {
    isOpen = false
    clearInterval(heartbeat)
    clearTimeout(expiry)
  })

  const drained = () => new Promise((resolve) => {
    const done = () => {
      response.off('drain', done)
      response.off('close', done)
      resolve()
    }

    response.on('drain', done)
    response.on('close', done)
  })

  return { send, drained, close, isOpen: () => isOpen }
}
