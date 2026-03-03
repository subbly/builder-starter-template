---
name: sync-from-api-client
description: Sync skills and store-actions from subbly-private-api-client repo into this project. Use when the user asks to copy, sync, or update files from subbly-private-api-client, or mentions syncing skills, store-actions, or bumping the private API client dependency.
---

# Sync from subbly-private-api-client

Sync workflow to copy updated files from the `/var/www/subbly-private-api-client` monorepo into this standalone project.

## What Gets Synced

| Source (subbly-private-api-client)  | Destination (this project) |
|-------------------------------------|----------------------------|
| `skills/`                           | `skills/`                  |
| `packages/store-actions/`           | `store-actions/`           |

## Sync Procedure

### 1. Sync skills

```bash
cp -r /var/www/subbly-private-api-client/skills/* /var/www/subbly-builder-default/skills/
```

If skills were removed upstream, manually delete the stale directories from `skills/`.

### 2. Sync store-actions

Copy all files except `node_modules` and `.env` (environment-specific):

```bash
find /var/www/subbly-private-api-client/packages/store-actions -mindepth 1 -maxdepth 1 \
  ! -name 'node_modules' ! -name '.env' \
  -exec cp -r {} /var/www/subbly-builder-default/store-actions/ \;
```

### 3. Fix workspace dependency

After syncing, `store-actions/package.json` will contain `"@subbly/private-api-client": "workspace:*"` from the monorepo. Replace with the latest published version:

```bash
npm view @subbly/private-api-client version
```

Then update `package.json` to use `"^<version>"` (e.g. `"^1.0.5"`).

### 4. Reinstall dependencies

```bash
cd store-actions && rm -rf node_modules && pnpm install
```

### 5. Regenerate param schemas

```bash
cd store-actions && node tmp/generate-params.js
```

## Commit Conventions

Split into separate commits:
- `chore: bump @subbly/private-api-client to ^x.y.z` for dependency changes
- `docs: regenerate params for private-api-client x.y.z` for regenerated schemas
