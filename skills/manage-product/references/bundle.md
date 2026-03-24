# Bundle Reference

What to gather, field constraints, and creation behavior for bundles. See SKILL.md for bundle type and selection type definitions.

## Pricing Mode

`priceType` and `discountType` control bundle pricing. Both can be null at the same time.

When both are null, plans cannot include `prices` or `discounts`. Items keep their original variant prices.

- Fixed (`configurable: 0`): backend forces `priceType: total`. No user choice needed.
- Configurable `variant`/`product`: set `priceType` OR `discountType` (not both).
- Configurable `single_product`: only `discountType` allowed. `priceType` is rejected.

`priceType` values:

- `per_item`: same price per bundle item; item `extraPrice` can adjust individual prices
- `total`: static base price for the whole bundle

`discountType` values:

- `per_item`: fixed discount per bundle item
- `total`: fixed discount on bundle total
- `percentage`: percentage-based discount

## Appearance Type

`appearanceType` controls the build-box flow layout:

- `one_step`: everything in one view
- `two_step`: config first, then item selection
- `without_ruleset`: like `one_step`, but tier is determined by selected item count

## Quantity Selectors

`quantitySelectors` is an optional array (e.g. `[1, 2, 3]`) for the customer to pick bundle quantity. Applies to the whole bundle, not individual items. Only for configurable bundles.

## What to Gather Before Creating

### Must Know

- Bundle slug: URL identifier, letters/numbers/hyphens/underscores only (max 70 chars)
- Bundle mode: fixed (`configurable: 0`) or configurable (`configurable: 1`)
- Physical vs digital: determines gifting and shipping-address behavior (`digital: 0|1`)
- At least one sellable item (variant) to add

### Should Know

- Bundle name (defaults to `Bundle #<count+1>` if omitted)
- Description and delivery info
- Tags and images (max 5)
- Whether pausing should be enabled (`pauseEnabled`, default is enabled)
- Whether gifting should be enabled (not allowed for digital bundles)
- Whether checkout should collect shipping address for digital bundles (`collectShippingAddress`)
- Pre-order end date (`preOrderEndAt`, YYYY-MM-DD): when set, all trial fields on every plan are prohibited (and vice versa)

### For Configurable Bundles

- Selection model: `variant`, `product`, or `single_product`
- Tier (ruleset) model: quantity-based vs total-based (`rulesetType`) unless `single_product`
- Price or discount model: `priceType` or `discountType` (never both for `variant`/`product`)
- For `single_product`: only `discountType` is available
- Tiers (rulesets): min/max ranges and optional labels/CTA copy
- Optional preference/filter metafields

## Create/Update Flow

Bundles are created as drafts. Publish separately.

Recommended order:

1. Create bundle
2. Add bundle items
3. Adjust bundle-level config (tiers, price/discount mode, preferences, filters)
4. Create or update bundle plans
5. Publish bundle

## Bundle Constraints

- Amounts are integers in cents
- Slugs must be unique per store
- Publish requires at least one bundle item and one active bundle plan
- Bundle publish also publishes all unarchived bundle plans
- Bundle archive is blocked when bundle has active subscriptions
- Physical bundles must keep `collectShippingAddress=1`
- Bundle filters allow at most one active filter
- If merchant plan does not allow optional pause, `pauseEnabled` can only be `1`
- Some changes are blocked when active subscriptions exist (tier type, plan price/discount updates, archiving)

## Coupled Update Fields

- Updating `discountType` requires `priceType` in the same payload (set to null if not applicable)
- Updating `rulesetType` requires `priceType` in the same payload (set to null if not applicable)
- Cannot update `rulesets` in the same request where `rulesetType` is sent

## Type-Switch Resets

These behaviors come from API update listeners and are easy to miss.

- Changing `priceType`:
  - `null -> value`: default price entries created for every active ruleset x active plan (`quantity: 1`, `amount: 0`)
  - `value -> null`: all bundle prices are archived
  - `value A -> value B`: prices archived and recreated with defaults
- Changing `discountType`:
  - `null -> value`: default discount entries created for every active ruleset x active plan
  - `value -> null`: all bundle discounts archived
  - Only switching between percentage and non-percentage triggers archive+recreate

## Bundle Items

Each item accepts `quantity`, `extraPrice`, `settings`, and `position`.

### Item Constraints

- Items must be valid one-time variants: not archived, not a gift card, not duplicated in same bundle
- `settings` (per-tier max-quantity) requires configurable bundle with `variant` or `product` selection
- `settings` is prohibited for fixed bundles and `single_product`
- Batch item create max is 200 items
- Deleting items is blocked when bundle would drop below minimum required count

## Tiers (Rulesets)

Tiers are rules, not selectors. A tier defines how many items the customer must select to complete their box. When a customer picks a tier (e.g. "6-item box"), they are committing to select that many items. The tier does not select items for them. It sets the required quantity the customer must fill by adding items.

- `quantity` type: tier based on number of selected bundle items per single bundle
- `total` type: tier based on cart subtotal/amount

`quantity` is the preferred and most common setup.

Each tier can include:

- `min` and `max` range. `max: null` means unlimited, only valid on the last tier. In responses: `minQuantity`/`maxQuantity` (quantity) or `minTotal`/`maxTotal` (total).
- Optional label (`name`)
- Optional CTA text (`ctaText`)

### Tier Constraints

- At least one active tier must remain
- Quantity tiers cannot overlap
- Total tiers must start at `min=0`, end with `max=null`, and be contiguous

### Tier Type-Switch Resets

Changing `rulesetType`:

- Existing active rulesets reset by position to new type defaults
- Existing bundle prices and discounts are archived

## Bundle Plans

Each plan requires base fields (`bundleId`, `type`, `name`). Depending on pricing mode, plans may also require `prices` or `discounts`. Subscription plans additionally need cadence, shippings, and scheduling fields.

### Plan Types

- `one_time`: single charge, no recurring schedule. Only one active one-time plan per bundle.
- `subscription`: recurring billing with cadence and optional shipping schedule

Archiving a plan is blocked when it is the last active plan or has active subscriptions.

### Plan Constraints

These fields cannot be changed after creation:

- `type` (`one_time` vs `subscription`)
- `frequencyUnit`
- `frequencyCount`

For `type: subscription`:

- Digital bundles cannot use shipping schedule, anchored billing, or charge-immediately controls

### Prices and Discounts

The bundle pricing mode determines which field a plan accepts:

- Non-configurable bundles require `prices`
- Configurable with `priceType` set require `prices`
- Configurable with `discountType` set (no `priceType`) require `discounts`
- Configurable with both null do not accept `prices` or `discounts`

#### Price/Discount Matrix

Plan pricing is a two-dimensional matrix:

- **Rows** = tiers (rulesets). Each active tier must have exactly one entry, referenced by `rulesetId`. Non-configurable bundles use the single default tier.
- **Columns** = ranges (quantity breakpoints). The `quantity` field is the cart quantity breakpoint where that price/discount applies.

The value depends on the mode:

- `prices` -> `amount` (price in cents)
- `discounts` -> `amountOff` (fixed cents) or `percentOff` (0-100), depending on `discountType`

#### Range Rules

- Ranges must always start from `quantity: 1`
- Quantity values must be unique within each tier
- Breakpoints must match across all tiers in the same payload

#### Example: Price Matrix (Configurable)

Two tiers, volume pricing for 1 or 3+ bundles:

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

Tier 10 (3-item): $10/item for 1-2 bundles, $9/item for 3+. Tier 11 (5-item): $8/item for 1-2 bundles, $7/item for 3+.

#### Example: Price Matrix (Fixed)

Single default tier, flat price:

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

One tier, $29.99 per bundle.

#### Example: Discount Matrix

`discountType: percentage`, increasing discounts for volume:

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

5% off for 1-2 bundles, 10% off for 3+.

### Subscription Plan Fields

For `type: subscription`, additionally include:

- `frequencyUnit`, `frequencyCount`: billing cadence (required)
- `shippings`: required for physical bundles, prohibited for digital
- Anchored billing: any `rebillingDay*` field switches to synchronized cycles
- Cutoff: `cutOffDays`, `cutOffTime` required for anchored billing, available with anchored shipping in adhoc
- `anchorDate`: required for daily-frequency anchored billing; use `"today"` to pin from now
- Optional: `chargeImmediately`, `shipImmediately`, `bufferDays`, `trial*`, `commitmentBillingCount`, `chargesLimit`, `surveyId`

### Billing Modes (Physical)

Physical subscription plans support:

- Adhoc (independent cycles): billing rolls from each subscriber signup date
- Anchored (synchronized cycles): billing on fixed calendar markers

Important behaviors:

- Shipments always happen after billing
- Cutoff windows gate inclusion in shipment/billing windows
- Trial fields not available for anchored billing

Read `subscription-scheduling.md` for full technical detail.

### Coherent vs Incoherent Shipping

- Coherent: billing and shipping at same cadence
- Incoherent: shipping more frequently than billing (prepaid pattern)

Example: bill every 3 months, ship monthly (3 shipments per cycle).

Read `subscription-scheduling.md` for anchored/adhoc shipping examples and cutoff detail.
