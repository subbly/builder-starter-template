import { Template, defaultBuildLogger } from 'e2b'
import { template } from './template'

async function main() {
  await Template.build(template, 'subbly-workspace-dev', {
    cpuCount: 4,
    memoryMB: 6144,
    onBuildLogs: defaultBuildLogger(),
  })
}

main().catch(console.error)
