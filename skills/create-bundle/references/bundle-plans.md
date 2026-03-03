# Bundle Plans

## Plan Types

Bundle plans support two types:

- `one_time`: single charge, no recurring schedule fields. Only one active one-time plan is allowed per bundle.
- `subscription`: recurring billing plan with cadence and optional shipping schedule controls

## Prices and Discounts

Every bundle plan payload requires `bundleId`, `type`, and `name`, then exactly one of two fields:

- `prices`: when bundle is non-configurable, or configurable with `priceType`
- `discounts`: when bundle is configurable with `discountType` and no `priceType`

### How the Price/Discount Matrix Works

Plan pricing is a two-dimensional matrix:

- **Rows** = tiers (rulesets). Each tier represents a range of bundle items the customer can select in the box. Every active tier must have exactly one entry in the payload, referenced by `rulesetId`. Non-configurable bundles have a single default tier created by the backend; use its `rulesetId`.
- **Columns** = ranges (quantity breakpoints). Each range entry represents a cart quantity (number of boxes). The `quantity` field is the breakpoint at which that price/discount starts applying: quantity 1 covers 1 box, quantity 3 means "from 3 boxes onward", etc.

The matrix value depends on the mode:
- `prices` → `amount` (price in cents)
- `discounts` → `amountOff` (fixed discount in cents) or `percentOff` (percentage discount, 0–100), depending on the bundle's `discountType`

### Range Rules

- Ranges must always start from `quantity: 1`. This is the base entry that covers 1 box.
- Quantity values must be unique within each tier.
- Quantity breakpoints must match across all tier entries in the same payload. If tier A has breakpoints `[1, 3, 5]`, every other tier must use the same breakpoints `[1, 3, 5]`.

### Example: Price Matrix for a Configurable Bundle

A bundle with `priceType: per_item`, two active tiers (3-item box and 5-item box), and volume pricing for 1 or 3+ boxes:

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

This reads as: tier 10 (e.g. 3-item box) costs $10/item for 1–2 boxes, $9/item for 3+ boxes. Tier 11 (e.g. 5-item box) costs $8/item for 1–2 boxes, $7/item for 3+ boxes.

### Example: Price Matrix for a Non-Configurable (Fixed) Bundle

A fixed bundle has a single default tier and `priceType` is forced to `total`. The range quantity only controls volume discounts by number of boxes:

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

This is the simplest case: one tier, flat $29.99 per box regardless of quantity.

### Example: Discount Matrix

A configurable bundle with `discountType: percentage`, one tier, and increasing discounts for buying more boxes:

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

This gives 5% off the original item prices for 1–2 boxes, 10% off for 3+ boxes.

## Subscription Plan Fields

For `type: subscription`, additionally include:

- `frequencyUnit`, `frequencyCount`: billing cadence (required)
- `shippings`: required for physical bundles, prohibited for digital
- Anchored billing: any `rebillingDay*` field switches the plan to synchronized cycles
- Cutoff: `cutOffDays`, `cutOffTime` required for anchored billing, available with anchored shipping in adhoc
- `anchorDate`: required for daily-frequency anchored billing; use `"today"` to pin from now
- Optional controls: `chargeImmediately`, `shipImmediately`, `bufferDays`, `trial*`, `commitmentBillingCount`, `chargesLimit`, `surveyId`

## Billing Modes (Physical)

Physical subscription plans support two practical billing modes:

- adhoc (independent cycles): billing rolls from each subscriber signup date
- anchored (synchronized cycles): billing runs on fixed calendar markers

Important behaviors:
- Shipments always happen after billing
- Cutoff windows (`cutOffDays`, `cutOffTime`) gate inclusion in shipment/billing windows
- Trial fields are not available for anchored billing

## Coherent vs Incoherent Shipping

A plan can include multiple shipping entries within one billing cycle.

- Coherent schedule: billing and shipping at same cadence (e.g. bill monthly, ship monthly)
- Incoherent schedule: shipping more frequently than billing (prepaid pattern)

Example incoherent model: bill every 3 months, ship monthly (3 shipments per billing cycle).

For full scheduling and constraints detail, use `references/subscription-scheduling.md`.
