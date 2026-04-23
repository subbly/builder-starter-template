import { Template, defaultBuildLogger } from 'e2b'
import { createTemplate } from './template'

async function main() {
  await Template.build(createTemplate({ dev: false }), 'subbly-workspace', {
    cpuCount: 4,
    memoryMB: 6144,
    onBuildLogs: defaultBuildLogger(),
  })
}

main().catch(console.error)
