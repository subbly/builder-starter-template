---
name: manage-store
description: "Typed client for querying and manipulating Subbly store data. Use when you need to fetch or modify products, bundles, tags, surveys, or metafields via Subbly Private API. Use pre-built scripts or create custom ones to interact with data. Resources: products (list, get), products.oneTime (create, update, publish, unpublish, archive, metadata), products.subscription (create, update, publish, unpublish, archive, metadata), products.variants (get, create, update, archive, batch), products.plans (get, create, update, archive), bundles (list, get, listItems, getItem, listGroups), tags (list), surveys (get), metafields (list, create, update)."
---

# Manage Store

The `/project/workspace/store-actions/` workspace provides pre-built scripts for querying and modifying Subbly store data via the `@subbly/private-api-client` package. All scripts output JSON to stdout. 

## Instructions

- Read ALL related params and responses for every planned step before executing any code (e.g., for creating a product with variants and publishing: read references/params/products/onetime/create.json, references/responses/products/response.md, references/params/products/variants/create.json, references/responses/products/variants/response.md, references/params/products/onetime/publish.json).
- Execute scripts in sequence, pipe output through `jq`. Use response data from earlier steps as input to later steps.
- Never hard-code API keys or URLs. Never read or search for `.env` or `.env.example`. Credentials are auto-injected via `/project/workspace/store-actions/lib/client.js`.

## Minimizing Output

IMPORTANT: API responses can be large. NEVER output a full response object. Instead:

- Pipe output through `jq` to extract only needed fields, count items, or inspect a single entry
- Save full responses to `/project/workspace/store-actions/results/` and use the `grep` tool to search within them
- Use pagination params (`perPage`, `page`) to limit result size at the API level
- Write a custom script in `/project/workspace/store-actions/tmp/` that fetches and filters data server-side instead of post-processing

## Available Scripts

All scripts run from project root: `node /project/workspace/store-actions/scripts/<path>`

### Products

- `/project/workspace/store-actions/scripts/products/list.js` — list products (perPage: 10, sorted by id desc)
- `/project/workspace/store-actions/scripts/products/get.js '<json>'` — get a single product

#### One-Time Products

- `/project/workspace/store-actions/scripts/products/onetime/create.js '<json>'` — create a one-time product
- `/project/workspace/store-actions/scripts/products/onetime/update.js '<json>'` — update a one-time product
- `/project/workspace/store-actions/scripts/products/onetime/publish.js '<json>'` — publish a one-time product
- `/project/workspace/store-actions/scripts/products/onetime/unpublish.js '<json>'` — unpublish a one-time product
- `/project/workspace/store-actions/scripts/products/onetime/archive.js '<json>'` — archive a one-time product
- `/project/workspace/store-actions/scripts/products/onetime/metadata.js '<json>'` — sync metadata on a one-time product

#### Subscription Products

- `/project/workspace/store-actions/scripts/products/subscription/create.js '<json>'` — create a subscription product
- `/project/workspace/store-actions/scripts/products/subscription/update.js '<json>'` — update a subscription product
- `/project/workspace/store-actions/scripts/products/subscription/publish.js '<json>'` — publish a subscription product
- `/project/workspace/store-actions/scripts/products/subscription/unpublish.js '<json>'` — unpublish a subscription product
- `/project/workspace/store-actions/scripts/products/subscription/archive.js '<json>'` — archive a subscription product
- `/project/workspace/store-actions/scripts/products/subscription/metadata.js '<json>'` — sync metadata on a subscription product

#### Variants

- `/project/workspace/store-actions/scripts/products/variants/get.js '<json>'` — get a product variant
- `/project/workspace/store-actions/scripts/products/variants/create.js '<json>'` — create a variant
- `/project/workspace/store-actions/scripts/products/variants/update.js '<json>'` — update a variant
- `/project/workspace/store-actions/scripts/products/variants/archive.js '<json>'` — archive a variant
- `/project/workspace/store-actions/scripts/products/variants/batch.js '<json>'` — batch create/update/archive variants

#### Plans

- `/project/workspace/store-actions/scripts/products/plans/get.js '<json>'` — get a subscription plan
- `/project/workspace/store-actions/scripts/products/plans/create.js '<json>'` — create a plan
- `/project/workspace/store-actions/scripts/products/plans/update.js '<json>'` — update a plan
- `/project/workspace/store-actions/scripts/products/plans/archive.js '<json>'` — archive a plan

### Bundles

- `/project/workspace/store-actions/scripts/bundles/list.js` — list bundles (perPage: 10, sorted by id desc)
- `/project/workspace/store-actions/scripts/bundles/get.js '<json>'` — get a single bundle
- `/project/workspace/store-actions/scripts/bundles/list-items.js '<json>'` — list items in a bundle
- `/project/workspace/store-actions/scripts/bundles/get-item.js '<json>'` — get a single bundle item
- `/project/workspace/store-actions/scripts/bundles/list-groups.js '<json>'` — list groups in a bundle

### Tags

- `/project/workspace/store-actions/scripts/tags/list.js` — list tags (perPage: 50, sorted by id desc)

### Surveys

- `/project/workspace/store-actions/scripts/surveys/get.js '<json>'` — get a survey

### Metafields

- `/project/workspace/store-actions/scripts/metafields/list.js` — list metafields (perPage: 50, sorted by id desc)
- `/project/workspace/store-actions/scripts/metafields/create.js '<json>'` — create a metafield
- `/project/workspace/store-actions/scripts/metafields/update.js '<json>'` — update a metafield (requires slug + dataType)

## Custom Scripts

NEVER modify files in `/project/workspace/store-actions/scripts/` — those are maintained templates.

Create custom scripts in `/project/workspace/store-actions/tmp/`. Boilerplate:

```js
import { client } from '../lib/client.js';

const result = await client.products.list({ perPage: 5 });
console.log(JSON.stringify(result, null, 2));
```

Run with: `node /project/workspace/store-actions/tmp/my-script.js`

## Looking Up Types

For detailed type information beyond what the references provide, use the Grep tool to search the package type definitions at `/project/workspace/store-actions/node_modules/@subbly/private-api-client/dist/index.d.ts`.

## References

IMPORTANT: Read params BEFORE executing scripts. Read response types to understand output shape.

|root: /project/workspace/skills/manage-store
|references/params/products:{list.json,get.json}
|references/params/products/onetime:{create.json,update.json,publish.json,unpublish.json,archive.json,metadata.json}
|references/params/products/subscription:{create.json,update.json,publish.json,unpublish.json,archive.json,metadata.json}
|references/params/products/variants:{get.json,create.json,update.json,archive.json,batch.json}
|references/params/products/plans:{get.json,create.json,update.json,archive.json}
|references/params/bundles:{list.json,get.json,list-items.json,get-item.json,list-groups.json}
|references/params/tags:{list.json}
|references/params/surveys:{get.json}
|references/params/metafields:{list.json,create.json,update.json}
|references/responses/products:{response.md,variants/response.md,plans/response.md}
|references/responses/bundles:{response.md,item-response.md,group-response.md}
|references/responses/tags:{response.md}
|references/responses/surveys:{response.md}
|references/responses/metafields:{response.md}
|references/responses:{paginated-response.md}

All list methods wrap responses in `PaginatedResponse<T>` (see `references/responses/paginated-response.md`).
