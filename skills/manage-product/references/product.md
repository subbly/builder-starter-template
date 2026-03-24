# Product Reference

What to gather, field details, and creation behavior for one-time and subscription products. See SKILL.md for product type definitions.

## What to Gather Before Creating

### Must Know

- Product name: display name on the storefront (max 255 chars)
- Product slug: URL identifier, letters/numbers/hyphens/underscores only (max 80 chars). Suggest one based on the name.
- Type: one-time, gift card, or subscription. Gift cards are technically one-time digital products with `giftCard.enabled: 1`.
- Physical or digital: determines if shipping address is collected. Cannot change after creation. Passed as `digital: 0` (physical) or `digital: 1` (digital). Gift cards are always digital.

### Should Know

- Description: HTML or plain text shown on the product page
- Images: up to 5 image URLs. Passed as `images: { create: [{ url, order }] }`
- Tags: for categorization and filtering. Passed as `tags: { create: [{ value }] }`

### For One-Time Products

- Variant price: in cents (1999 = $19.99). At least one variant required.
- Variant options: up to 3 name/value pairs per variant (e.g. Size/Small, Color/Blue)
- Whether gifting is enabled: allows purchasing as a gift for someone else

### For Gift Cards

- Denomination amounts: each variant is a voucher value the customer can buy (e.g. $25, $50, $100). At least one denomination required.
- Expiration: how many months until the voucher expires (1 to 36), or no expiration

### For Subscription Products

- Billing frequency: `frequencyUnit` (day, week, month) and `frequencyCount` (how many units per cycle)
- Plan price: in cents, per billing cycle
- Billing type (physical only): independent cycles (adhoc) or synchronized cycles (anchored). See `subscription-scheduling.md`.
- Shipping schedule (physical only): same cadence as billing (coherent) or more frequent (incoherent/prepaid)
- Anchored shipping or billing (physical only): pin billing or shipping to a specific calendar day
- Cut-off window (physical only, with anchored shipping or billing): days before first shipment date as deadline for new signups/renewals (`cutOffDays`). Required with anchored billing, available with anchored shipping in adhoc.
- Pause: enabled by default. Only ask if the merchant wants to disable (`pauseEnabled: 0`).
- Setup fee (optional): one-time fee on first order, in cents
- Trial (optional): trial price and duration in days. Not available with anchored billing.
- Commitment (optional): `commitmentBillingCount`, minimum billing cycles before cancellation allowed
- Charges limit (optional): `chargesLimit`, maximum billing cycles before auto-expiry

## Variants (One-Time)

Every one-time product needs at least one variant. A variant has a price in cents and optional option name/value pairs (up to 3 per variant).

If the product has a single option (e.g. just a price), create one "default" variant with no option names.

## Plans (Subscription)

Each plan defines:

- Billing frequency: `frequencyUnit` + `frequencyCount`
- Price per billing cycle in cents
- Physical plans: `shipmentSchedule` (required)
- Optional: `setupFee`, `trialPrice`, `trialLengthDays`, `commitmentBillingCount`, `chargesLimit`, `pauseEnabled`, `surveyId`

Digital subscription plans cannot use: `shipmentSchedule`, `anchorDate`, `rebillingDay*`, `cutOffDays`, `cutOffTime`, `chargeImmediately`, `trialSingleOrder`.

## Creation Behavior

- Products are created as **drafts**. Publish separately to appear on the storefront.
- All prices are integers in **cents**. Confirm with the user to avoid mistakes (e.g. 20 instead of 2000 for $20).
- Slugs must be unique across the store. If creation fails with a slug conflict, suggest an alternative.
