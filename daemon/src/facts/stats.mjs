import { readFileSync, readdirSync, readlinkSync } from 'node:fs'
import { respond } from '../server/server.mjs'

export function stats({ build, starts }) {
  return (_request, response) => {
    const status = readFileSync('/proc/self/status', 'utf8')
    const fds = readdirSync('/proc/self/fd')

    respond(response, {
      build,
      uptime: Math.round(process.uptime()),
      starts,
      rss: kilobytes(status, 'VmRSS') * 1024,
      rssPeak: kilobytes(status, 'VmHWM') * 1024,
      fds: fds.length,
      inotify: fds.reduce((watches, fd) => watches + inotifyWatches(fd), 0),
    })
  }
}

const kilobytes = (status, field) => Number(new RegExp(`^${field}:\\s+(\\d+) kB$`, 'm').exec(status)?.[1] ?? 0)

const inotifyWatches = (fd) => {
  try {
    if (readlinkSync(`/proc/self/fd/${fd}`) !== 'anon_inode:inotify') {
      return 0
    }

    return readFileSync(`/proc/self/fdinfo/${fd}`, 'utf8').split('\n').filter((line) => line.startsWith('inotify wd:')).length
  } catch {
    return 0
  }
}
