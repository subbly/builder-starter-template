---
name: create-bundle
description: "Guide for creating and updating Subbly bundles via the Private API. A bundle is a specific product type for selling fixed curated boxes, configurable build-your-own boxes, or subscribe-and-save offers. Use when the user wants to create or update a fixed or configurable bundle, manage items and plans, configure tiers (rulesets), prices, and discounts, and publish. Covers bundle modes, field meanings, and edge cases before running scripts."
---

# Create Bundles

Guide for creating and updating bundles in the Subbly store via the Private API. Use `manage-store` skill for execution details and param schemas.

## Bundle Modes

A bundle can be fixed (`configurable: 0`) or configurable (`configurable: 1`).

### Fixed bundles (`configurable: 0`)

A fixed bundle is a set of items sold together as one product/offer. It lets the merchant sell multiple products at once in a single purchase. Customers cannot select specific items, use preferences, or use filters. The price is flat and can only be tiered by item quantity in the cart.

Key behavior:
- `selectionType` is forced to `null`
- `priceType` is forced to `total`
- `rulesetType` cannot be set by user for non-configurable bundles; backend defaults it to `quantity`
- `showRulesetName`, `rulesetType`, `appearanceType`, `quantitySelectors`, `filters`, `preferences`, `rulesets` are not available
- non-configurable bundles still get a pre-created default tier (ruleset) in backend, used for plan price payloads

### Configurable bundles (`configurable: 1`)

A configurable bundle is commonly positioned as a "build box": a powerful system to customize a box using preferences, tiers (rulesets), flexible price and discount setups, appearance types, and selection types.

For configurable bundles, prices or discounts are configured via `priceType` or `discountType`.

- `priceType`: mode where bundle prices are driven by a price matrix:
  `plan x tier (ruleset) (item quantity) x box quantity range`.
  - `priceType: per_item`: selected items use the same base price from the selected plan tier/range; item `extraPrice` can still make final item prices different.
  - `priceType: total`: bundle uses a static/base offer price from the plan range for the selected quantity.
- `discountType`: mode where original bundle item prices are kept and a bundle discount is applied on top.
  - `discountType: per_item`: discount is applied per selected bundle item quantity.
  - `discountType: total`: discount is applied to the bundle total.
  - `discountType: percentage`: same scope rules as above, but discount value is percentage-based instead of fixed amount.

`priceType` and `discountType` are mutually exclusive.

`appearanceType` controls how the build-box flow is presented:
- `one_step`: all information is displayed in one step, including tiers (rulesets), quantity selection, preferences, filters, plans, and item selection
- `two_step`: tiers (rulesets), quantity selection, plan, and preferences are in the first step; filters and item selection are in the second step
- `without_ruleset`: similar to `one_step`, but tier (ruleset) selection is based on the number of selected items

`selectionType` controls how it behaves:
- `variant`: customer selects variants from a flat list
- `product`: customer selects variants from a grouped list by one-time product; multiple variants can be selected from one group. Most common selection type in production stores.
- `single_product`: similar to a common "subscribe and save" flow; customer selects variants from grouped one-time products, with only one variant allowed per group item

`quantitySelectors` is an array of predefined quantity values (e.g. `[1, 2, 3]`) that let the customer quickly switch the total number of boxes. It applies to the whole bundle, not to individual items. The selected value multiplies the entire configured bundle: selecting 2 boxes with item A (qty 1) and item B (qty 2) results in 2 units of A and 4 units of B. Only available for configurable bundles.

#### Tiers (rulesets)

Tiers (rulesets) define the qualification ranges for bundle price and discount logic.

- `quantity` tier (ruleset) type: tier is based on number of selected bundle items
- `total` tier (ruleset) type: tier is based on cart subtotal/amount

`quantity` tier (ruleset) type is the preferred and most common setup in production stores.

Each tier (ruleset) can include:
- `min` and `max` range. `max: null` means unlimited and is only valid on the last tier. In the response these are represented as `minQuantity`/`maxQuantity` (quantity) or `minTotal`/`maxTotal` (total).
- optional label (`name`)
- optional CTA text (`ctaText`)

Practical constraints:
- At least one active tier (ruleset) must remain
- Quantity tiers (rulesets) cannot overlap
- Total tiers (rulesets) must start at `min=0`, end with `max=null`, and be contiguous
- Changing tier (ruleset) type can reset existing tier ranges and archive existing price/discount data

## Talking to the User

When discussing bundle setup, use business language first. Avoid raw JSON or field names until you are building the final payload.

Example: say "customers can pick up to 3 items from this section" instead of `settings.create[].maxQuantity`.

## What to Know Before Creating or Updating

Before calling create/update scripts, gather these from the user.

### Must know

- Bundle slug: URL identifier, letters/numbers/hyphens/underscores only (max 70 chars)
- Bundle mode: fixed (`configurable: 0`) or configurable (`configurable: 1`)
- Physical vs digital: determines gifting and shipping-address behavior (`digital: 0|1`)
- At least one sellable item (variant) to add into the bundle

### Should know

- Bundle name (defaults to `Bundle #<count+1>` if omitted)
- Description and delivery info
- Tags and images (max 5)
- Whether pausing should be enabled (`pauseEnabled`, default is enabled)
- Whether gifting should be enabled (not allowed for digital bundles)
- Whether checkout should collect shipping address for digital bundles (`collectShippingAddress`)
- Pre-order end date (`preOrderEndAt`, YYYY-MM-DD): enables a pre-order window; when set, **all trial fields on every plan of this bundle are prohibited** (and vice versa)

### For bundle items

Each item accepts `quantity`, `extraPrice`, `settings`, and `position`. See item schema for per-field constraints.

### For configurable bundles

- Selection model: `variant`, `product`, or `single_product`
- Tier (ruleset) model: quantity-based vs total-based (`rulesetType`) unless `single_product`
- Price or discount model: `priceType` or `discountType` (never both)
- Tiers (rulesets): min/max ranges and optional labels/CTA copy
- Optional preference/filter metafields

### For bundle plans

- Plan type: `one_time` or `subscription` (only one active one-time plan is allowed per bundle)
- Plan display name
- Price/discount ranges for each active tier (ruleset)
- For subscription plans: cadence, shipping schedule (physical only), cutoff and trial settings

## Creating Bundle Plans

Bundle plan prices and discounts are validated against bundle state: configurable mode, price or discount mode, active tiers (rulesets), and plan type.

Every plan needs base fields + either `prices` or `discounts`. Subscription plans additionally need cadence, shippings, and scheduling fields.

Read `references/bundle-plans.md` for plan types, prices and discounts, subscription fields, and billing modes.
Read `references/subscription-scheduling.md` for anchored/adhoc shipping examples and cutoff detail.

For plan create/update/get execution and parameter references, use the `manage-store` skill.

## Create/Update Flow

Bundles are created as drafts. Publish separately.

Recommended order:
1. Create bundle
2. Add bundle items
3. Adjust bundle-level config (tiers (rulesets), price or discount mode, preferences, filters)
4. Create or update bundle plans
5. Publish bundle

## Edge Cases and Resets

Read `references/bundle-edge-cases.md` before any non-trivial bundle update.

Important: switching tier (ruleset) type (`rulesetType`), `priceType`, or `discountType` can archive existing price/discount data and repopulate defaults.

## Operational Notes

- Amounts are integers in cents
- Slugs must be unique per store
- Publish requires at least one bundle item and one active bundle plan
- Some changes are blocked when active subscriptions exist (bundle-level tier (ruleset) type, plan price and discount updates, archiving bundle/plan)

## References

IMPORTANT: Read local references first for behavior and edge cases.

|root: /project/workspace/skills/create-bundle
|references/references:{bundle-edge-cases.md,bundle-plans.md,subscription-scheduling.md}
