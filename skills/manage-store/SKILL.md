---
name: manage-store
description: "Typed client for querying and manipulating Subbly store data. Use when you need to fetch or modify products, bundles, tags, surveys, or metafields via Subbly Private API. Use pre-built scripts or create custom ones to interact with data. Resources: products (list, get), products.oneTime (create, update, publish, unpublish, archive, metadata), products.subscription (create, update, publish, unpublish, archive, metadata), products.variants (get, create, update, archive, batch), products.plans (get, create, update, archive), bundles (list, get, create, update, publish, unpublish, archive, metadata, listGroups), bundles.items (create, update, delete, batch), bundles.plans (get, create, update, archive), tags (list), surveys (get), metafields (list, create, update)."
---

# Manage Store

The `/project/workspace/store-actions/` workspace provides pre-built scripts for querying and modifying Subbly store data via the `@subbly/private-api-client` package. All scripts output JSON to stdout.

## Instructions

- Before executing a script, read its script reference file (listed in Available Scripts below) then read the params and response files it points to. Read ONLY the references for the script you are about to execute -- do not bulk-read all references upfront.
- When chaining multiple scripts, read references one step at a time. After each script completes, read the next step's references before proceeding.

<example>
Task: "Create a bundle with a plan and publish it"

Thinking: I need 3 scripts in sequence. I'll read references just before each call:
1. Read `params/bundles/create.yaml` + `responses/bundles/response.md`, then run `bundles/create.js`
2. Read `params/bundles/plans/create.yaml` + `responses/bundles/plan-response.md`, then run `bundles/plans/create.js`
3. Read `params/bundles/publish.yaml` (no response needed for publish), then run `bundles/publish.js`

I'll pipe each output through jq and chain IDs forward.
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

Run: `node <scripts>/<script> '<json>'`

Before running a script, read its reference file to find params and response paths.

All list methods return `PaginatedResponse<T>` (see `<ref>/responses/paginated-response.md`).
Batch methods return `{ create: T[], update?: T[], delete?: T[], archive?: T[] }`.

|root: /project/workspace/skills/manage-store/references
|scripts/{products,variants,plans,bundles,tags,surveys,metafields}.md

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
