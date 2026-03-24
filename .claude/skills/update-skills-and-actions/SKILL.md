---
name: update-skills-and-actions
description: Update skills and store-actions from subbly-private-api-client repo into this project. Use when the user asks to copy, sync, or update files from subbly-private-api-client, or mentions updating skills, store-actions, or bumping the private API client dependency.
---

# Sync from subbly-private-api-client

Sync workflow to copy updated files from the `/var/www/subbly-private-api-client` monorepo into this standalone project.

## What Gets Synced

| Source (subbly-private-api-client)  | Destination (this project) |
|-------------------------------------|----------------------------|
| `skills/manage-store/`              | `skills/manage-store/`     |
| `skills/manage-product/`            | `skills/manage-product/`   |
| `packages/store-actions/`           | `store-actions/`           |

**Only the two skills above are synced.** Other skills in `skills/` (e.g. localization, cms-integration, frontend-design, troubleshooting) are local-only and must not be touched during sync.

## Sync Procedure

### 1. Remove stale files

Before copying, compare both trees to find files that exist locally but were removed upstream. `cp` only adds/overwrites — it does NOT delete removed files, so this must be done explicitly:

```bash
# Check for stale skills files (only synced skills)
for skill in manage-store manage-product; do
  diff <(cd /var/www/subbly-private-api-client/skills/$skill && find . -type f | sort) \
       <(cd /var/www/subbly-builder-default/skills/$skill && find . -type f | sort)
done

# Check for stale store-actions files
diff <(cd /var/www/subbly-private-api-client/packages/store-actions && find . -type f ! -path '*/node_modules/*' ! -name '.env' | sort) \
     <(cd /var/www/subbly-builder-default/store-actions && find . -type f ! -path '*/node_modules/*' ! -name '.env' | sort)
```

Lines prefixed with `>` are files that exist locally but not upstream — delete them with `rm`.

### 2. Sync skills

```bash
for skill in manage-store manage-product; do
  cp -r /var/www/subbly-private-api-client/skills/$skill/* /var/www/subbly-builder-default/skills/$skill/
done
```

### 3. Sync store-actions

Copy all files except `node_modules` and `.env` (environment-specific):

```bash
find /var/www/subbly-private-api-client/packages/store-actions -mindepth 1 -maxdepth 1 \
  ! -name 'node_modules' ! -name '.env' \
  -exec cp -r {} /var/www/subbly-builder-default/store-actions/ \;
```

### 4. Fix workspace dependency

After syncing, `store-actions/package.json` will contain `"@subbly/private-api-client": "workspace:*"` from the monorepo. Replace with the latest published version:

```bash
npm view @subbly/private-api-client version
```

Then update `package.json` to use `"^<version>"` (e.g. `"^1.0.5"`).

### 5. Reinstall dependencies

```bash
cd store-actions && rm -rf node_modules && pnpm install
```

## Commit Conventions

- `chore: sync from subbly-private-api-client` for the sync changes
