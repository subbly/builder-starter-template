import { readFileSync, readdirSync, readlinkSync } from 'node:fs'

export function watchedInodes() {
  return readdirSync('/proc/self/fd').flatMap((fd) => {
    try {
      if (readlinkSync(`/proc/self/fd/${fd}`) !== 'anon_inode:inotify') {
        return []
      }

      return [...readFileSync(`/proc/self/fdinfo/${fd}`, 'utf8').matchAll(/^inotify wd:\S+ ino:([0-9a-f]+)/gm)].map((match) => Number.parseInt(match[1], 16))
    } catch {
      return []
    }
  })
}
