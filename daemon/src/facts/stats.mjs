import { readFileSync, readdirSync } from 'node:fs'
import { respond } from '../server/server.mjs'
import { watchedInodes } from './inotify.mjs'

export function stats({ build, starts }) {
  return (_request, response) => {
    const status = readFileSync('/proc/self/status', 'utf8')

    respond(response, {
      build,
      uptime: Math.round(process.uptime()),
      starts,
      rss: kilobytes(status, 'VmRSS') * 1024,
      rssPeak: kilobytes(status, 'VmHWM') * 1024,
      fds: readdirSync('/proc/self/fd').length,
      inotify: watchedInodes().length,
    })
  }
}

const kilobytes = (status, field) => Number(new RegExp(`^${field}:\\s+(\\d+) kB$`, 'm').exec(status)?.[1] ?? 0)
