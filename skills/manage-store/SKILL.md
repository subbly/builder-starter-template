---
name: manage-store
description: >
  Typed client for querying and manipulating Subbly store data. Use when you need to fetch or modify products, bundles, tags, surveys, or metafields via Subbly Private API. Use pre-built scripts or create custom ones to interact with data. Resources: products (list, get, getVariant, getPlan), bundles (list, get, listItems, getItem, listGroups), tags (list), surveys (get), metafields (list, create, update).
---

# Manage Store

The `/project/workspace/store-actions/` workspace provides pre-built scripts for querying and modifying Subbly store data via the `@subbly/private-api-client` package. All scripts output JSON to stdout.

## Workflow

ALWAYS follow these steps in order. Reading params and response types first prevents incorrect arguments and wasted API calls.

1. Choose a script or action from Available Scripts, or plan a custom one
2. Use `read` tool to read input params from `references/params/`
3. Use `read` tool to read response types from `references/responses/`
4. Execute the script, pipe output through `jq` to extract only needed fields

## References

References are located at base directory for this skill.

- Input params: `references/params/{resource}-{method}-params.json` — e.g. `products-list-params.json` for `client.products.list()`
- Response types: `references/responses/{entity}-response.md` — e.g. `product-response.md` for `Product`. All list methods wrap in `PaginatedResponse<T>` (see `paginated-response.md`).

## Minimizing Output

IMPORTANT: API responses can be large. NEVER output a full response object. Instead:

- Pipe output through `jq` to extract only needed fields, count items, or inspect a single entry
- Save full responses to `/project/workspace/store-actions/results/` and use the `grep` tool to search within them
- Use pagination params (`perPage`, `page`) to limit result size at the API level
- Write a custom script in `/project/workspace/store-actions/tmp/` that fetches and filters data server-side instead of post-processing

## Available Scripts

All scripts run from project root: `node /project/workspace/store-actions/scripts/<script>.js`

Products:

- `list-products.js` — list products (perPage: 10, sorted by id desc)
- `get-product.js <id>` — get a single product
- `get-variant.js <id>` — get a product variant
- `get-plan.js <id>` — get a subscription plan

Bundles:

- `list-bundles.js` — list bundles (perPage: 10, sorted by id desc)
- `get-bundle.js <id>` — get a single bundle
- `list-bundle-items.js <bundleId>` — list items in a bundle
- `list-bundle-groups.js <bundleId>` — list groups in a bundle

Tags:

- `list-tags.js` — list tags (perPage: 50, sorted by id desc)

Surveys:

- `get-survey.js <id>` — get a survey

Metafields:

- `list-metafields.js` — list metafields (perPage: 50, sorted by id desc)
- `create-metafield.js '<json>'` — create a metafield
- `update-metafield.js '<json>'` — update a metafield (requires slug + dataType)

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

