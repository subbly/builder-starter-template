---
name: create-bundle
description: "Guide for creating and updating Subbly bundles via the Private API. A bundle is a specific product type for selling fixed curated boxes, configurable build-your-own boxes, or subscribe-and-save offers. Use when the user wants to create or update a fixed or configurable bundle, manage items and plans, configure tiers (rulesets), prices, and discounts, and publish. Covers bundle modes, field meanings, and edge cases before running scripts."
---

# Create Bundles

Guide for creating and updating bundles in the Subbly store via the Private API. Use `manage-store` skill for execution details and param schemas.

## Talking to the User

When discussing bundle setup, use business language first. Avoid raw JSON or field names until you are building the final payload.

Avoid using internal technical aliases in parentheses when communicating. For example, say "tiers" not "tiers (rulesets)". The parenthetical forms exist only for internal reference in this document.

Example: say "customers can pick up to 3 items from this section" instead of `settings.create[].maxQuantity`.

### Terminology Map

Merchants describe the same concepts differently depending on their niche. Recognize these synonyms and map them to the right internal concept.

**Bundle**: box, subscription box, kit, pack, crate, bag, set, collection, bundle, offer

**Bundle items**: items, products, servings, pieces, meals, recipes, treats, samples, picks, slots, selections, snacks, books, candles, bottles, cards (anything domain-specific the merchant puts in their bundle)

**Tiers (rulesets)**: box sizes, bundle size, sizes (small / medium / large), tiers, levels, packs, options (e.g. "6-item box", "12-item box")

## Manage Bundle

### Bundle Modes

A bundle can be fixed (`configurable: 0`) or configurable (`configurable: 1`).

#### Fixed bundles (`configurable: 0`)

A fixed bundle is a set of items sold together as one product/offer. It lets the merchant sell multiple products at once in a single purchase. Customers cannot select specific items, use preferences, or use filters. The price is flat and can only be tiered by item quantity in the cart.

Key behavior:
- `selectionType` is forced to `null`
- `priceType` is forced to `total`
- `rulesetType` cannot be set by user for non-configurable bundles; backend defaults it to `quantity`
- `showRulesetName`, `rulesetType`, `appearanceType`, `quantitySelectors`, `filters`, `preferences`, `rulesets` are not available
- non-configurable bundles still get a pre-created default tier (ruleset) in backend, used for plan price payloads

#### Configurable bundles (`configurable: 1`)

A configurable bundle is commonly positioned as a "build box": a powerful system to customize a bundle using preferences, tiers (rulesets), flexible price and discount setups, appearance types, and selection types.

#### Selection Type

`selectionType` controls how the customer selects items:

- `variant`: customer selects variants from a flat list.
- `product`: customer selects variants grouped by one-time product; multiple variants per group. Most common in production stores.
- `single_product`: "subscribe and save" flow; variants grouped by one-time product, one variant per group.

#### Pricing Mode

`priceType` and `discountType` control bundle pricing. Both can be null at the same time.

When `priceType` and `discountType` are null plans cannot include `prices` or `discounts`. Items keep their original variant prices with no bundle-level pricing adjustment.

- Fixed (`configurable: 0`): backend forces `priceType: total`. No user choice needed.
- Configurable `variant`/`product`: set `priceType` OR `discountType` (not both).
- Configurable `single_product`: only `discountType` allowed. `priceType` is rejected.

`priceType` values:
- `per_item`: same price per bundle item; item `extraPrice` can still make final item prices different.
- `total`: static base price for the whole bundle.

`discountType` values:
- `per_item`: fixed discount per bundle item.
- `total`: fixed discount on bundle total.
- `percentage`: percentage-based discount.

#### Appearance Type

`appearanceType` controls the build-box flow layout:

- `one_step`: everything in one view: tiers, quantity, preferences, filters, plans, items.
- `two_step`: config (tiers, quantity, plan, preferences) first, then item selection.
- `without_ruleset`: like `one_step`, but tier is determined by selected item count.

#### Quantity Selectors

`quantitySelectors` is an optional array of values (e.g. `[1, 2, 3]`) for the customer to pick bundle quantity. Applies to the whole bundle, not individual items. Selecting 2 bundles with item A (qty 1) and item B (qty 2) results in 2x A and 4x B. Only available for configurable bundles.

### What to Know Before Creating or Updating

Before calling create/update scripts, gather these from the user.

#### Must know

- Bundle slug: URL identifier, letters/numbers/hyphens/underscores only (max 70 chars)
- Bundle mode: fixed (`configurable: 0`) or configurable (`configurable: 1`)
- Physical vs digital: determines gifting and shipping-address behavior (`digital: 0|1`)
- At least one sellable item (variant) to add into the bundle

#### Should know

- Bundle name (defaults to `Bundle #<count+1>` if omitted)
- Description and delivery info
- Tags and images (max 5)
- Whether pausing should be enabled (`pauseEnabled`, default is enabled)
- Whether gifting should be enabled (not allowed for digital bundles)
- Whether checkout should collect shipping address for digital bundles (`collectShippingAddress`)
- Pre-order end date (`preOrderEndAt`, YYYY-MM-DD): enables a pre-order window; when set, **all trial fields on every plan of this bundle are prohibited** (and vice versa)

#### For configurable bundles

- Selection model: `variant`, `product`, or `single_product`
- Tier (ruleset) model: quantity-based vs total-based (`rulesetType`) unless `single_product`
- Price or discount model: `priceType` or `discountType` (never both for `variant`/`product`)
- For `single_product`: only `discountType` is available, `priceType` is not allowed
- Tiers (rulesets): min/max ranges and optional labels/CTA copy
- Optional preference/filter metafields

### Create/Update Flow

Bundles are created as drafts. Publish separately.

Recommended order:
1. Create bundle
2. Add bundle items
3. Adjust bundle-level config (tiers (rulesets), price or discount mode, preferences, filters)
4. Create or update bundle plans
5. Publish bundle

### Bundle Constraints

- Amounts are integers in cents
- Slugs must be unique per store
- Publish requires at least one bundle item and one active bundle plan
- Bundle publish also publishes all unarchived bundle plans
- Bundle archive is blocked when bundle has active subscriptions
- Physical bundles must keep `collectShippingAddress=1`
- Bundle filters allow at most one active filter
- If merchant plan does not allow optional pause, `pauseEnabled` can only be `1`
- Some changes are blocked when active subscriptions exist (bundle-level tier (ruleset) type, plan price and discount updates, archiving bundle/plan)

### Coupled Update Fields

- Updating `discountType` requires `priceType` in the same payload (set to null if not applicable)
- Updating `rulesetType` requires `priceType` in the same payload (set to null if not applicable)
- You cannot update `rulesets` in the same request where `rulesetType` is sent

### Type-Switch Resets

These behaviors come from private API update listeners and are easy to miss.

- Changing `priceType`:
  - `null -> value`: default price entries are created for every active ruleset x active plan (`quantity: 1`, `amount: 0`)
  - `value -> null`: all bundle prices are archived
  - `value A -> value B`: prices are archived and recreated with defaults
- Changing `discountType`:
  - `null -> value`: default discount entries are created for every active ruleset x active plan
  - `value -> null`: all bundle discounts are archived
  - Only switching between percentage and non-percentage triggers archive+recreate

## Manage Bundle Items

Each item accepts `quantity`, `extraPrice`, `settings`, and `position`. See item schema for per-field constraints.

### Item Constraints

Bundle items must be valid one-time variants:
- not archived
- not a gift card
- not duplicated inside the same bundle

Other constraints:
- batch item create max is 200 items
- deleting items is blocked when bundle would drop below minimum required count

## Manage Bundle Tiers

Tiers (rulesets) define the qualification ranges for bundle price and discount logic.

- `quantity` tier (ruleset) type: tier is based on number of selected bundle items per single bundle, regardless of bundle quantity in cart
- `total` tier (ruleset) type: tier is based on cart subtotal/amount

`quantity` tier (ruleset) type is the preferred and most common setup in production stores.

Each tier (ruleset) can include:
- `min` and `max` range. `max: null` means unlimited and is only valid on the last tier. In the response these are represented as `minQuantity`/`maxQuantity` (quantity) or `minTotal`/`maxTotal` (total).
- optional label (`name`)
- optional CTA text (`ctaText`)

### Tier Constraints

- At least one active tier (ruleset) must remain
- Quantity tiers (rulesets) cannot overlap
- Total tiers (rulesets) must start at `min=0`, end with `max=null`, and be contiguous

### Tier Type-Switch Resets

Changing `rulesetType`:
- Existing active rulesets are reset by position to the new type defaults (`quantity` or `total` shape)
- Existing bundle prices and discounts are archived

## Manage Bundle Plans

Each plan requires base fields (`bundleId`, `type`, `name`). Depending on the bundle pricing mode, plans may also require `prices` or `discounts`. Subscription plans additionally need cadence, shippings, and scheduling fields.

For plan create/update/get execution and parameter references, use the `manage-store` skill.

### Plan Types

Bundle plans support two types:

- `one_time`: single charge, no recurring schedule fields. Only one active one-time plan is allowed per bundle.
- `subscription`: recurring billing plan with cadence and optional shipping schedule controls

Archiving a bundle plan is blocked when it is the last active plan or has active subscriptions.

### Plan Constraints

The following plan fields cannot be changed after creation:
- `type` (`one_time` vs `subscription`)
- `frequencyUnit`
- `frequencyCount`

For bundle plans of `type: subscription`:
- digital bundles cannot use shipping schedule, anchored billing fields, or charge-immediately controls

### Prices and Discounts

The bundle pricing mode determines which pricing field a plan accepts:

- Non-configurable bundles require `prices`.
- Configurable bundles with `priceType` set require `prices`.
- Configurable bundles with `discountType` set (no `priceType`) require `discounts`.
- Configurable bundles with both `priceType` and `discountType` null do not accept `prices` or `discounts`.

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

## References

IMPORTANT: Read local references first for behavior and edge cases.

|root: /project/workspace/skills/create-bundle
|references/references:{subscription-scheduling.md}
