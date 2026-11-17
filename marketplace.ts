import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

export const MARKETPLACES_DIR = '.cache/marketplaces'

const DEFAULT_REPO_URL = 'https://git.subbly.io/subbly-plugins/subbly-plugins.git'

export function seedMarketplace(): string {
  const repoUrl = process.env.PLUGINS_MARKETPLACE_URL ?? DEFAULT_REPO_URL
  const staging = join(MARKETPLACES_DIR, '.clone')

  rmSync(MARKETPLACES_DIR, { recursive: true, force: true })
  mkdirSync(MARKETPLACES_DIR, { recursive: true })
  execFileSync('git', [...auth(), 'clone', '-q', '--no-checkout', repoUrl, staging], { stdio: 'inherit' })

  const manifest = execFileSync('git', ['-C', staging, 'show', 'HEAD:marketplace.json'], { encoding: 'utf8' })
  const { slug } = JSON.parse(manifest) as { slug: string }

  renameSync(staging, join(MARKETPLACES_DIR, slug))
  console.log(`Seeded marketplace ${slug} from ${repoUrl}`)

  return slug
}

function auth(): string[] {
  const token = process.env.GIT_PLUGINS_READ_TOKEN

  if (!token) {
    return []
  }

  return ['-c', `http.extraHeader=Authorization: Basic ${Buffer.from(`oauth2:${token}`).toString('base64')}`]
}
