---
name: manage-store
description: "Typed client for querying and manipulating Subbly store data. Use when you need to fetch or modify products, bundles, tags, surveys, or metafields via Subbly Private API. Use pre-built scripts or create custom ones to interact with data. Resources: products (list, get), products.oneTime (create, update, publish, unpublish, archive, metadata), products.subscription (create, update, publish, unpublish, archive, metadata), products.variants (get, create, update, archive, batch), products.plans (get, create, update, archive), bundles (list, get, listItems, getItem, listGroups), tags (list), surveys (get), metafields (list, create, update)."
---

# Manage Store

The `/project/workspace/store-actions/` workspace provides pre-built scripts for querying and modifying Subbly store data via the `@subbly/private-api-client` package. All scripts output JSON to stdout.

## Instructions

- Read ALL related params and responses for every planned step before executing any code (e.g., for creating a product with variants and publishing: read references/params/products/onetime/create.json, references/responses/products/response.md, references/params/products/variants/create.json, references/responses/products/variants/response.md, references/params/products/onetime/publish.json).
- Execute scripts in sequence, pipe output through `jq`. Use response data from earlier steps as input to later steps.
- Never hard-code API keys or URLs. Never read or search for `.env` or `.env.example`. Credentials are auto-injected via `store-actions/lib/client.js`.

## Minimizing Output

IMPORTANT: API responses can be large. NEVER output a full response object. Instead:

- Pipe output through `jq` to extract only needed fields, count items, or inspect a single entry
- Save full responses to `/project/workspace/store-actions/results/` and use the `grep` tool to search within them
- Use pagination params (`perPage`, `page`) to limit result size at the API level
- Write a custom script in `/project/workspace/store-actions/tmp/` that fetches and filters data server-side instead of post-processing

## Available Scripts

All scripts run from project root: `node /project/workspace/store-actions/scripts/<path>`

### Products

- `products/list.js` — list products (perPage: 10, sorted by id desc)
- `products/get.js <id>` — get a single product

#### One-Time Products

- `products/onetime/create.js '<json>'` — create a one-time product
- `products/onetime/update.js '<json>'` — update a one-time product
- `products/onetime/publish.js <id>` — publish a one-time product
- `products/onetime/unpublish.js <id>` — unpublish a one-time product
- `products/onetime/archive.js <id>` — archive a one-time product
- `products/onetime/metadata.js '<json>'` — sync metadata on a one-time product

#### Subscription Products

- `products/subscription/create.js '<json>'` — create a subscription product
- `products/subscription/update.js '<json>'` — update a subscription product
- `products/subscription/publish.js <id>` — publish a subscription product
- `products/subscription/unpublish.js <id>` — unpublish a subscription product
- `products/subscription/archive.js <id>` — archive a subscription product
- `products/subscription/metadata.js '<json>'` — sync metadata on a subscription product

#### Variants

- `products/variants/get.js <id>` — get a product variant
- `products/variants/create.js '<json>'` — create a variant
- `products/variants/update.js '<json>'` — update a variant
- `products/variants/archive.js <id>` — archive a variant
- `products/variants/batch.js '<json>'` — batch create/update/archive variants

#### Plans

- `products/plans/get.js <id>` — get a subscription plan
- `products/plans/create.js '<json>'` — create a plan
- `products/plans/update.js '<json>'` — update a plan
- `products/plans/archive.js <id>` — archive a plan

### Bundles

- `bundles/list.js` — list bundles (perPage: 10, sorted by id desc)
- `bundles/get.js <id>` — get a single bundle
- `bundles/list-items.js <bundleId>` — list items in a bundle
- `bundles/get-item.js <bundleId> <itemId>` — get a single bundle item
- `bundles/list-groups.js <bundleId>` — list groups in a bundle

### Tags

- `tags/list.js` — list tags (perPage: 50, sorted by id desc)

### Surveys

- `surveys/get.js <id>` — get a survey

### Metafields

- `metafields/list.js` — list metafields (perPage: 50, sorted by id desc)
- `metafields/create.js '<json>'` — create a metafield
- `metafields/update.js '<json>'` — update a metafield (requires slug + dataType)

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

|root: ./references
|IMPORTANT: Read params BEFORE executing scripts. Read response types to understand output shape.
|params/products:{list.json,get.json}
|params/products/onetime:{create.json,update.json,publish.json,unpublish.json,archive.json,metadata.json}
|params/products/subscription:{create.json,update.json,publish.json,unpublish.json,archive.json,metadata.json}
|params/products/variants:{get.json,create.json,update.json,batch.json}
|params/products/plans:{get.json,create.json,update.json}
|params/bundles:{list.json,get.json,list-items.json,get-item.json,list-groups.json}
|params/tags:{list.json}
|params/surveys:{get.json}
|params/metafields:{list.json,create.json,update.json}
|responses/products:{response.md,variants/response.md,plans/response.md}
|responses/bundles:{response.md,item-response.md,group-response.md}
|responses/tags:{response.md}
|responses/surveys:{response.md}
|responses/metafields:{response.md}
|responses:{paginated-response.md}

All list methods wrap responses in `PaginatedResponse<T>` (see `responses/paginated-response.md`).
