import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const WORKSPACE_ROOT = '/var/www/subbly-builder-default'

const REQUIRED_ENV_VARS = [ 
  'DO_SPACES_KEY',
  'DO_SPACES_SECRET',
  'DO_SPACES_ENDPOINT',
  'DO_SPACES_BUCKET',
  'DO_SPACES_CDN',
] as const

function getVersion(): string {
  const version = process.argv[2]

  if (!version) {
    console.error('Usage: pnpm build:migration <version>')
    console.error('Example: pnpm build:migration 1.1.0')
    process.exit(1)
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Invalid version format: ${version}. Expected semver (e.g., 1.1.0)`)
    process.exit(1)
  }

  return version
}

function validateEnvVars(): Record<(typeof REQUIRED_ENV_VARS)[number], string> {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  return Object.fromEntries(
    REQUIRED_ENV_VARS.map((key) => [key, process.env[key]!])
  ) as Record<(typeof REQUIRED_ENV_VARS)[number], string>
}

function buildArchive(version: string): string {
  const outputPath = `/tmp/upgrade-${version}.tar.gz`

  console.log(`Building migration archive v${version}...`)

  const includes = [
    'skills/',
    'store-actions/ --exclude=store-actions/node_modules',
    '.codesandbox/tasks.json',
    '.devcontainer/Dockerfile',
    'ecosystem.config.js',
    '.gitignore',
    '.csbignore',
  ]

  const tarCommand = `tar -czf ${outputPath} ${includes.join(' ')}`

  execSync(tarCommand, { cwd: WORKSPACE_ROOT, stdio: 'inherit' })

  console.log(`Archive created: ${outputPath}`)

  return outputPath
}

async function uploadArchive(
  archivePath: string,
  version: string,
  env: Record<(typeof REQUIRED_ENV_VARS)[number], string>
): Promise<string> {
  const s3 = new S3Client({
    endpoint: env.DO_SPACES_ENDPOINT,
    region: 'nyc3',
    credentials: {
      accessKeyId: env.DO_SPACES_KEY,
      secretAccessKey: env.DO_SPACES_SECRET,
    },
  })

  const key = `migrations/v${version}/upgrade.tar.gz`
  const body = readFileSync(archivePath)

  console.log(`Uploading to ${env.DO_SPACES_BUCKET}/${key}...`)

  await s3.send(
    new PutObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/gzip',
      ACL: 'public-read',
    })
  )

  const cdnUrl = `${env.DO_SPACES_CDN}/migrations/v${version}/upgrade.tar.gz`

  console.log(`Upload complete!`)
  console.log(`CDN URL: ${cdnUrl}`)

  return cdnUrl
}

async function main() {
  const version = getVersion()
  const env = validateEnvVars()
  const archivePath = buildArchive(version)
  await uploadArchive(archivePath, version, env)
}

main().catch((error) => {
  console.error('Failed to build migration archive:', error)
  process.exit(1)
})
