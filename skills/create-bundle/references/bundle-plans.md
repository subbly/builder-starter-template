# Bundle Plans

## Plan Types

Bundle plans support two types:

- `one_time`: single charge, no recurring schedule fields. Only one active one-time plan is allowed per bundle.
- `subscription`: recurring billing plan with cadence and optional shipping schedule controls

## Prices and Discounts

Every bundle plan payload requires `bundleId`, `type`, and `name`, then exactly one of two fields:

- `prices`: when bundle is non-configurable, or configurable with `priceType`
- `discounts`: when bundle is configurable with `discountType` and no `priceType`

Each entry uses `rulesetId` + `ranges`. Range value fields: `amount` for prices, `amountOff` or `percentOff` for discounts. See `plan.ts` schema for all constraints.

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
