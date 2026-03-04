---
name: manage-store
description: "Typed client for querying and manipulating Subbly store data. Use when you need to fetch or modify products, bundles, tags, surveys, or metafields via Subbly Private API. Use pre-built scripts or create custom ones to interact with data. Resources: products (list, get), products.oneTime (create, update, publish, unpublish, archive, metadata), products.subscription (create, update, publish, unpublish, archive, metadata), products.variants (get, create, update, archive, batch), products.plans (get, create, update, archive), bundles (list, get, create, update, publish, unpublish, archive, metadata, listGroups), bundles.items (create, update, delete, batch), bundles.plans (get, create, update, archive), tags (list), surveys (get), metafields (list, create, update)."
---

# Manage Store

The `/project/workspace/store-actions/` workspace provides pre-built scripts for querying and modifying Subbly store data via the `@subbly/private-api-client` package. All scripts output JSON to stdout. 

## Instructions

- ALWAYS read ALL related params and responses before executing a script or creating a tmp script.

<example>
Task: "Create a bundle with a plan and publish it"

Thinking: I need to create a bundle, add a plan to it, then publish. Let me identify all scripts and references I'll use:
1. `bundles/create.js` → read `params/bundles/create.json` + `responses/bundles/response.md`
2. `bundles/plans/create.js` → read `params/bundles/plans/create.json` + `responses/bundles/plan-response.md`
3. `bundles/publish.js` → read `params/bundles/publish.json`

I must read ALL six files before executing any script, so I understand the full data flow — what fields the create response returns (e.g. bundle `id`) and what the next step requires as input.
</example>

- Execute scripts in sequence, pipe output through `jq`. Use response data from earlier steps as input to later steps.
- Never hard-code API keys or URLs. Never read or search for `.env` or `.env.example`. Credentials are auto-injected via `/project/workspace/store-actions/lib/client.js`.

## Minimizing Output

IMPORTANT: API responses can be large. NEVER output a full response object. Instead:

- Pipe output through `jq` to extract only needed fields, count items, or inspect a single entry
- Save full responses to `/project/workspace/store-actions/results/` and use the `grep` tool to search within them
- Use pagination params (`perPage`, `page`) to limit result size at the API level
- Write a custom script in `/project/workspace/store-actions/tmp/` that fetches and filters data server-side instead of post-processing
- When a mutating script (create, update, delete, batch, publish, archive) is piped through `jq` and the command fails, the error may be from `jq`, not the API. The API call likely already succeeded. Never retry a mutating call after a pipe failure. Instead, fetch the entity to verify current state before deciding to retry. Prefer decoupling: save raw output to `/project/workspace/store-actions/results/` first, then format with `jq` separately.

## Available Scripts

<scripts>: `/project/workspace/store-actions/scripts`
<ref>: `/project/workspace/skills/manage-store/references`

Run: `node <scripts>/<script> '<json[path]>'`

`script <json[path]>` - read params schema at `<ref>/path` BEFORE executing. `[path]` - read response type at `<ref>/path` to understand output.

All list methods return `PaginatedResponse<T>` (see `<ref>/responses/paginated-response.md`).

Batch methods return type `{ create: T[], update?: T[], delete?: T[], archive?: T[] }`. For better understanding read response references

### Products [responses/products/response.md]

- `products/list.js <json[params/products/list.json]>`
- `products/get.js <json[params/products/get.json]>`

#### One-Time Products

- `products/onetime/create.js <json[params/products/onetime/create.json]>`
- `products/onetime/update.js <json[params/products/onetime/update.json]>`
- `products/onetime/publish.js <json[params/products/onetime/publish.json]>`
- `products/onetime/unpublish.js <json[params/products/onetime/unpublish.json]>`
- `products/onetime/archive.js <json[params/products/onetime/archive.json]>`
- `products/onetime/metadata.js <json[params/products/onetime/metadata.json]>`

#### Subscription Products

- `products/subscription/create.js <json[params/products/subscription/create.json]>`
- `products/subscription/update.js <json[params/products/subscription/update.json]>`
- `products/subscription/publish.js <json[params/products/subscription/publish.json]>`
- `products/subscription/unpublish.js <json[params/products/subscription/unpublish.json]>`
- `products/subscription/archive.js <json[params/products/subscription/archive.json]>`
- `products/subscription/metadata.js <json[params/products/subscription/metadata.json]>`

#### Variants [responses/products/variants/response.md]

- `products/variants/get.js <json[params/products/variants/get.json]>`
- `products/variants/create.js <json[params/products/variants/create.json]>`
- `products/variants/update.js <json[params/products/variants/update.json]>`
- `products/variants/archive.js <json[params/products/variants/archive.json]>`
- `products/variants/batch.js <json[params/products/variants/batch.json]>`

#### Plans [responses/products/plans/response.md]

- `products/plans/get.js <json[params/products/plans/get.json]>`
- `products/plans/create.js <json[params/products/plans/create.json]>`
- `products/plans/update.js <json[params/products/plans/update.json]>`
- `products/plans/archive.js <json[params/products/plans/archive.json]>`

### Bundles [responses/bundles/response.md]

- `bundles/list.js <json[params/bundles/list.json]>`
- `bundles/get.js <json[params/bundles/get.json]>`
- `bundles/create.js <json[params/bundles/create.json]>`
- `bundles/update.js <json[params/bundles/update.json]>`
- `bundles/publish.js <json[params/bundles/publish.json]>`
- `bundles/unpublish.js <json[params/bundles/unpublish.json]>`
- `bundles/archive.js <json[params/bundles/archive.json]>`
- `bundles/metadata.js <json[params/bundles/metadata.json]>`

#### Bundle Groups [responses/bundles/group-response.md]

- `bundles/list-groups.js <json[params/bundles/list-groups.json]>`

#### Bundle Items [responses/bundles/item-response.md]

- `bundles/items/create.js <json[params/bundles/items/create.json]>`
- `bundles/items/update.js <json[params/bundles/items/update.json]>`
- `bundles/items/delete.js <json[params/bundles/items/delete.json]>`
- `bundles/items/batch.js <json[params/bundles/items/batch.json]>`

#### Bundle Plans [responses/bundles/plan-response.md]

- `bundles/plans/get.js <json[params/bundles/plans/get.json]>`
- `bundles/plans/create.js <json[params/bundles/plans/create.json]>`
- `bundles/plans/update.js <json[params/bundles/plans/update.json]>`
- `bundles/plans/archive.js <json[params/bundles/plans/archive.json]>`

### Tags [responses/tags/response.md]

- `tags/list.js <json[params/tags/list.json]>`

### Surveys [responses/surveys/response.md]

- `surveys/get.js <json[params/surveys/get.json]>`

### Metafields [responses/metafields/response.md]

- `metafields/list.js <json[params/metafields/list.json]>`
- `metafields/create.js <json[params/metafields/create.json]>`
- `metafields/update.js <json[params/metafields/update.json]>`

## Custom Scripts

NEVER modify files in `/project/workspace/store-actions/scripts/` - those are maintained templates.

Create custom scripts in `/project/workspace/store-actions/tmp/`. Boilerplate:

```js
import { client } from '../lib/client.js';

const result = await client.products.list({ perPage: 5 });
console.log(JSON.stringify(result, null, 2));
```

Run with: `node /project/workspace/store-actions/tmp/my-script.js`

## Looking Up Types

For detailed type information beyond what the references provide, use the Grep tool to search the package type definitions at `/project/workspace/store-actions/node_modules/@subbly/private-api-client/dist/index.d.ts`.
