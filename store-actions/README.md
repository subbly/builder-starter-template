# Store Actions

## Install

From repo root:

```bash
pnpm install
pnpm --filter @subbly/private-api-client build
cp packages/store-actions/.env.example packages/store-actions/.env
```

Set `SUBBLY_API_KEY` in `packages/store-actions/.env`.

Optional:
- `SUBBLY_API_URL`

## Run

From repo root:

```bash
pnpm --filter store-actions run run ./scripts/<path>.js
```

Examples:

```bash
pnpm --filter store-actions run run ./scripts/products/list.js
pnpm --filter store-actions run run ./scripts/bundles/get.js '{"id":123}'
echo '{"id":123}' | pnpm --filter store-actions run run ./scripts/bundles/publish.js
```
