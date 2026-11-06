import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { connect } from 'node:net'
import { once } from 'node:events'
import { eventStream } from './event-stream.mjs'

test('a frame delivered after the reader went away settles, so the route does not park forever', async () => {
  let stream
  const server = createServer((_request, response) => {
    stream = eventStream(response, null)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const socket = connect(server.address().port, '127.0.0.1')
  socket.write('GET / HTTP/1.1\r\nhost: daemon\r\n\r\n')
  socket.pause()
  while (!stream) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  const frame = { type: 'snapshot', entries: 'x'.repeat(64 * 1024) }
  while (stream.isOpen() && stream.send(frame)) {}
  socket.destroy()
  while (stream.isOpen()) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  const settled = await Promise.race([stream.deliver(frame).then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 500))])

  server.close()
  assert.equal(settled, true)
})
