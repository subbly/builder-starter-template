import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer as createHttpServer } from 'node:http'
import { createServer as createTcpServer } from 'node:net'
import { after, test } from 'node:test'
import { answers, listeningInode } from '../bundle/port.mjs'

const tcp6 = `  sl  local_address                         remote_address                        st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
   0: 00000000000000000000000000000000:71F2 00000000000000000000000000000000:0000 0A 00000000:00000000 00:00000000 00000000  1000        0 31337 1 0000000000000000 100 0 0 10 0
   1: 0000000000000000FFFF00000100007F:0BB8 0000000000000000FFFF00000100007F:D2F0 06 00000000:00000000 03:00000F9E 00000000     0        0 0 3 0000000000000000
   2: 00000000000000000000000000000000:0BB8 00000000000000000000000000000000:0000 0A 00000000:00000000 00:00000000 00000000  1000        0 48211 1 0000000000000000 100 0 0 10 0
`

test('the listening socket on a port is found by its inode, never a connection to it', () => {
  assert.equal(listeningInode(tcp6, 3000), '48211')
  assert.equal(listeningInode(tcp6, 29170), '31337')
  assert.equal(listeningInode(tcp6, 3001), null)
  assert.equal(listeningInode('', 3000), null)
})

const answering = createHttpServer((_request, response) => response.writeHead(400).end())
const silent = createTcpServer(() => {})
const sockets = new Set()

silent.on('connection', (socket) => sockets.add(socket))
answering.listen(0, '127.0.0.1')
silent.listen(0, '127.0.0.1')
await Promise.all([once(answering, 'listening'), once(silent, 'listening')])
after(() => {
  answering.close()
  silent.close()
  sockets.forEach((socket) => socket.destroy())
})

test('a server that answers HTTP is listening, whatever the status', async () => {
  assert.equal(await answers({ port: answering.address().port, path: '/__nextjs_original-stack-frames', timeout: 500 }), true)
})

test('a server that accepts TCP and never answers is not listening', async () => {
  const started = Date.now()

  assert.equal(await answers({ port: silent.address().port, path: '/', timeout: 300 }), false)
  assert.ok(Date.now() - started < 1000)
})

test('a closed port is not listening', async () => {
  const closed = createTcpServer()

  closed.listen(0, '127.0.0.1')
  await once(closed, 'listening')
  const { port } = closed.address()
  closed.close()
  await once(closed, 'close')

  assert.equal(await answers({ port, path: '/', timeout: 300 }), false)
})
