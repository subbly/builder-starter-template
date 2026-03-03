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

A configurable bundle is commonly positioned as a "build box": a powerful system to customize a bundle using preferences, tiers (rulesets), flexible price and discount setups, appearance types, and selection types.

For configurable bundles, prices or discounts are configured via `priceType` or `discountType`.

- `priceType`: mode where bundle prices are driven by a price matrix:
  - `priceType: per_item`: selected bundle items use the same price per bundle item; item `extraPrice` can still make final item prices different.
  - `priceType: total`: bundle uses a static/base price for the whole bundle.
- `discountType`: mode where original bundle item prices are kept and a bundle discount is applied on top.
  - `discountType: per_item`: discount is applied per bundle item.
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

`quantitySelectors` is an array of predefined quantity values (e.g. `[1, 2, 3]`) that let the customer quickly switch the total number of bundles. It applies to the whole bundle, not to individual items. The selected value multiplies the entire configured bundle: selecting 2 bundles with item A (qty 1) and item B (qty 2) results in 2 units of A and 4 units of B. Only available for configurable bundles.

#### Tiers (rulesets)

Tiers (rulesets) define the qualification ranges for bundle price and discount logic.

- `quantity` tier (ruleset) type: tier is based on number of selected bundle items per single bundle, regardless of bundle quantity in cart
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

Avoid using internal technical aliases in parentheses when communicating. For example, say "tiers" not "tiers (rulesets)". The parenthetical forms exist only for internal reference in this document.

Example: say "customers can pick up to 3 items from this section" instead of `settings.create[].maxQuantity`.

### Terminology Map

Merchants describe the same concepts differently depending on their niche. Recognize these synonyms and map them to the right internal concept.

**Bundle**: box, subscription box, kit, pack, crate, bag, set, collection, bundle, offer

**Bundle items**: items, products, servings, pieces, meals, recipes, treats, samples, picks, slots, selections, snacks, books, candles, bottles, cards (anything domain-specific the merchant puts in their bundle)

**Tiers (rulesets)**: box sizes, bundle size, sizes (small / medium / large), tiers, levels, packs, options (e.g. "6-item box", "12-item box")

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

For plan create/update/get execution and parameter references, use the `manage-store` skill.

### Plan Types

Bundle plans support two types:

- `one_time`: single charge, no recurring schedule fields. Only one active one-time plan is allowed per bundle.
- `subscription`: recurring billing plan with cadence and optional shipping schedule controls

### Prices and Discounts

Every bundle plan payload requires `bundleId`, `type`, and `name`, then exactly one of two fields:

- `prices`: when bundle is non-configurable, or configurable with `priceType`
- `discounts`: when bundle is configurable with `discountType` and no `priceType`

#### How the Price/Discount Matrix Works

Plan pricing is a two-dimensional matrix:

- **Rows** = tiers (rulesets). Each tier represents a range of bundle items the customer can select in the bundle. Every active tier must have exactly one entry in the payload, referenced by `rulesetId`. Non-configurable bundles have a single default tier created by the backend; use its `rulesetId`.
- **Columns** = ranges (quantity breakpoints). Each range entry represents a cart quantity (number of bundles). The `quantity` field is the breakpoint at which that price/discount starts applying: quantity 1 covers 1 bundle, quantity 3 means "from 3 bundles onward", etc.

The matrix value depends on the mode:
- `prices` → `amount` (price in cents)
- `discounts` → `amountOff` (fixed discount in cents) or `percentOff` (percentage discount, 0–100), depending on the bundle's `discountType`

#### Range Rules

- Ranges must always start from `quantity: 1`. This is the base entry that covers 1 bundle.
- Quantity values must be unique within each tier.
- Quantity breakpoints must match across all tier entries in the same payload. If tier A has breakpoints `[1, 3, 5]`, every other tier must use the same breakpoints `[1, 3, 5]`.

#### Example: Price Matrix for a Configurable Bundle

A bundle with `priceType: per_item`, two active tiers (3-item bundle and 5-item bundle), and volume pricing for 1 or 3+ bundles:

```json
"prices": [
  {
    "rulesetId": 10,
    "ranges": [
      { "quantity": 1, "amount": 1000 },
      { "quantity": 3, "amount": 900 }
    ]
  },
  {
    "rulesetId": 11,
    "ranges": [
      { "quantity": 1, "amount": 800 },
      { "quantity": 3, "amount": 700 }
    ]
  }
]
```

This reads as: tier 10 (e.g. 3-item bundle) costs $10/item for 1–2 bundles, $9/item for 3+ bundles. Tier 11 (e.g. 5-item bundle) costs $8/item for 1–2 bundles, $7/item for 3+ bundles.

#### Example: Price Matrix for a Non-Configurable (Fixed) Bundle

A fixed bundle has a single default tier and `priceType` is forced to `total`. The range quantity only controls volume discounts by number of bundles:

```json
"prices": [
  {
    "rulesetId": 5,
    "ranges": [
      { "quantity": 1, "amount": 2999 }
    ]
  }
]
```

This is the simplest case: one tier, flat $29.99 per bundle regardless of quantity.

#### Example: Discount Matrix

A configurable bundle with `discountType: percentage`, one tier, and increasing discounts for buying more bundles:

```json
"discounts": [
  {
    "rulesetId": 10,
    "ranges": [
      { "quantity": 1, "percentOff": 5 },
      { "quantity": 3, "percentOff": 10 }
    ]
  }
]
```

This gives 5% off the original item prices for 1–2 bundles, 10% off for 3+ bundles.

### Subscription Plan Fields

For `type: subscription`, additionally include:

- `frequencyUnit`, `frequencyCount`: billing cadence (required)
- `shippings`: required for physical bundles, prohibited for digital
- Anchored billing: any `rebillingDay*` field switches the plan to synchronized cycles
- Cutoff: `cutOffDays`, `cutOffTime` required for anchored billing, available with anchored shipping in adhoc
- `anchorDate`: required for daily-frequency anchored billing; use `"today"` to pin from now
- Optional controls: `chargeImmediately`, `shipImmediately`, `bufferDays`, `trial*`, `commitmentBillingCount`, `chargesLimit`, `surveyId`

### Billing Modes (Physical)

Physical subscription plans support two practical billing modes:

- adhoc (independent cycles): billing rolls from each subscriber signup date
- anchored (synchronized cycles): billing runs on fixed calendar markers

Important behaviors:
- Shipments always happen after billing
- Cutoff windows (`cutOffDays`, `cutOffTime`) gate inclusion in shipment/billing windows
- Trial fields are not available for anchored billing

### Coherent vs Incoherent Shipping

A plan can include multiple shipping entries within one billing cycle.

- Coherent schedule: billing and shipping at same cadence (e.g. bill monthly, ship monthly)
- Incoherent schedule: shipping more frequently than billing (prepaid pattern)

Example incoherent model: bill every 3 months, ship monthly (3 shipments per billing cycle).

Read `references/subscription-scheduling.md` for anchored/adhoc shipping examples and cutoff detail.

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
|references/references:{bundle-edge-cases.md,subscription-scheduling.md}
