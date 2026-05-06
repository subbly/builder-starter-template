---
name: visual-edits
description: "Guide for handling visual edits made by the user on the agentic website. Use when a text content update targets dynamic content loaded from the Subbly API (products, bundles, surveys, plans, metafields, tags, etc.) and the change cannot be applied by editing the source code alone."
---

# Visual Edits

## Text Content Update

When a text update targets content that originates from data loaded from an external source, the text cannot be changed by editing the source code — the value is fetched at runtime and any code edit will be overwritten on the next data fetch.

### Subbly API Dynamic Content

#### How to Identify

The text is Subbly API content when it is rendered from data returned by Subbly API calls or hooks. Common patterns:

- `product.name`, `product.description`, `product.deliveryInfo`
- `bundle.name, `bundle.description`, `bundle.deliveryInfo`
- `plan.pricingName`
- `metafield.name`, `metafield.values`
- `survey.name`, `survey.description`
- Any field rendered from objects fetched via `subblyApi.*` methods or Subbly React hooks (`useProduct`, `useBundle`, etc.)

#### How to Handle

Do NOT silently skip the change or apply a code-only edit. Present the user with three options:

**Option A — Update in Subbly Admin (via API)**
Update the text at the source using the Subbly API. Use the `manage-store` skill to find the appropriate update script for the entity type (product, bundle, metafield, etc.). Tell the user:
- The entity type, name, and ID that holds the text
- That the change will apply everywhere this entity's data is displayed
- That this updates the canonical data in Subbly

Example prompt to user:
> The text "[current text]" comes from the [entity type] "[entity name]" (ID: [id]). Would you like me to update it in Subbly using the API? This will change it everywhere this [entity type] appears.

**Option B — Local Overwrite**
Create a local mapping that overrides the API content for this specific entity, keeping the website independent from the admin data. Implement by mapping the entity ID to the replacement text so the rendered output uses the local value instead of the API value.

Implementation approach:
- Create or extend a local overrides module (e.g. `src/lib/subbly/content-overrides.ts`)
- Map by entity type and ID to replacement field values
- Apply the override at the rendering layer, after data is fetched but before display

Example structure:
```ts
// src/lib/subbly/content-overrides.ts
export const contentOverrides: Record<string, Record<number, Record<string, string>>> = {
  product: {
    123: { name: 'Custom Product Name' },
  },
  bundle: {
    456: { name: 'Custom Bundle Name', description: 'Custom description' },
  },
}
```

Tell the user:
- The override applies only on this website, not in Subbly admin
- Future API data changes for this entity will not affect the overridden fields

Example prompt to user:
> The text "[current text]" comes from the [entity type] "[entity name]" (ID: [id]). I can create a local override so this website shows "[new text]" instead, without changing the data in Subbly. The override will apply only here.

**Option C — Skip**
The user will handle the change themselves in the Subbly admin, or will make another request later.

Example prompt to user:
> The text "[current text]" comes from the [entity type] "[entity name]" (ID: [id]) loaded from Subbly. I'll skip this change — you can update it in the Subbly admin or let me know if you'd like to handle it differently.

#### Always Present All Three Options

When you detect that a text update targets Subbly API content, present all three options in a single message so the user can choose. Do not assume which option the user prefers.