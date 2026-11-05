import { execFileSync } from 'node:child_process'
import { Template, defaultBuildLogger } from 'e2b'
import { type Environment, createTemplate } from './template'

export function getVersionArg(): string {
  const args = process.argv.slice(2)
  const index = args.indexOf('--version')
  const version = index === -1 ? undefined : args[index + 1]
  if (!version || version.startsWith('--')) {
    console.error('Missing required --version <tag>. Example: pnpm e2b:build:prod --version 1.13')
    process.exit(1)
  }
  return version
}

export async function buildTemplate(name: string, environment: Environment) {
  const version = getVersionArg()
  execFileSync('node', ['daemon/manifest.mjs', '--check'], { stdio: 'inherit' })
  const info = await Template.build(createTemplate(environment), name, {
    tags: [version, 'latest'],
    cpuCount: 4,
    memoryMB: 6144,
    onBuildLogs: defaultBuildLogger(),
  })
  console.log(`Built ${info.name} build ${info.buildId} with tags: ${info.tags.join(', ')}`)
}
