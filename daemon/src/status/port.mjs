export * as Port from './port.mjs'

import { readFileSync, readdirSync, readlinkSync } from 'node:fs'
import { request } from 'node:http'

export function listeningInode(table, port) {
  const local = `:${port.toString(16).toUpperCase().padStart(4, '0')}`

  for (const line of table.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/)

    if (fields[3] === '0A' && fields[1]?.endsWith(local)) {
      return fields[9]
    }
  }

  return null
}

export function holder(port) {
  let held = { inode: null, pid: null }

  return () => {
    const inode = listeningInode(table('/proc/net/tcp6'), port) ?? listeningInode(table('/proc/net/tcp'), port)

    if (inode === null) {
      return null
    }

    if (inode !== held.inode) {
      held = { inode, pid: socketOwner(inode) }
    }

    return held.pid
  }
}

export function isAnswering({ port, path, timeout }) {
  return new Promise((resolve) => {
    const probe = request({ host: '127.0.0.1', port, path, agent: false, headers: { connection: 'close' } })
    const timer = setTimeout(() => probe.destroy(), timeout)

    probe.once('response', (response) => {
      clearTimeout(timer)
      response.destroy()
      resolve(true)
    })
    probe.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
    probe.end()
  })
}

const table = (path) => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

const socketOwner = (inode) => {
  const target = `socket:[${inode}]`
  const pids = readdirSync('/proc').filter((name) => /^\d+$/.test(name)).sort((a, b) => b - a)

  for (const pid of pids) {
    for (const fd of entries(`/proc/${pid}/fd`)) {
      if (link(`/proc/${pid}/fd/${fd}`) === target) {
        return Number(pid)
      }
    }
  }

  return null
}

const entries = (path) => {
  try {
    return readdirSync(path)
  } catch {
    return []
  }
}

const link = (path) => {
  try {
    return readlinkSync(path)
  } catch {
    return null
  }
}
