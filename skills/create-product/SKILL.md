---
name: create-product
description: "Guide for creating Subbly products via the Private API. Use when the user wants to create a one-time, gift card, or subscription product, add variants or plans, and publish. Covers product types, field meanings, and what to gather from the user before calling creation scripts."
---

# Create Product

Guide for creating products in the Subbly store via the Private API. Uses `store-actions` scripts and `manage-store` skill for param schemas.

## Product Types

There are two API-level product types: `one_time` and `subscription`. The type is determined by which creation script you call and cannot be changed after creation.

### One-Time Products

A one-time product is a single purchase. The customer buys it once and receives it.

One-time products use variants for pricing. Every one-time product needs at least one variant to be purchasable, even if there is only one option (a "default" variant with just a price).

Can be physical or digital. Physical products collect a shipping address at checkout, digital products skip shipping.

### Gift Cards (Gift Vouchers)

A gift card is a one-time digital product with `giftCard.enabled: 1`. It is always digital.

When a customer buys a gift card they receive a gift voucher for a specific amount of money. They can send this voucher to someone else and the recipient can use it to purchase items in the store. The voucher balance covers the cost at checkout.

Variants on a gift card act as denominations. Each variant represents a different voucher value the customer can choose to buy. For example a gift card product might have three variants: $25, $50, and $100. The variant price is the voucher amount.

Gift cards have an optional expiration set via `giftCard.expiration` (1 to 36 months). If not set the gift voucher does not expire.

### Subscription Products

A subscription product bills the customer on a recurring schedule.

Subscription products use plans instead of variants. Each plan defines a billing frequency (e.g. every 1 month, every 2 weeks) and a price per cycle. A subscription product needs at least one plan.

Can be physical or digital. Supports setup fees, pause/resume, trials, and commitment periods, all configured on the plan level.

Digital subscriptions are memberships. They have no physical shipping so the following plan fields are prohibited: `shipmentSchedule`, `anchorDate`, `rebillingDay*`, `cutOffDays`, `cutOffTime`, `chargeImmediately`, `trialSingleOrder`. Billing rolls from the subscriber's signup date.

Physical subscriptions require a `shipmentSchedule` on the plan. They support two billing types:
- Independent cycles (adhoc): each subscriber's billing rolls from their own signup date
- Synchronized cycles (anchored): all subscribers bill on a fixed calendar day. Has two modes: any month/week during a cycle (soft anchored) and at the beginning of a new cycle (hard anchored, uses `anchorDate`)

Shipments always happen after billing. A shipment cannot be scheduled before its billing date.

A physical subscription can have multiple shipments per billing cycle. When billing and shipping happen at the same cadence (bill monthly, ship monthly) the schedule is coherent. When they are mismatched (bill every 3 months, ship monthly) the schedule is incoherent. This is a prepaid model where the customer pays upfront for multiple deliveries within one billing cycle.

See `references/subscription-scheduling.md` for the full technical detail on billing types, shipping formats, cutoff windows, anchoring behavior, and field availability.

## Talking to the User

When discussing product setup with the user, use human-readable language. Do not show JSON, field names, or script arguments. Translate API concepts into business terms (e.g. "ships on the 15th of each month" not `unitDay: 15`, "billed every 3 months" not `frequencyCount: 3`). Only use technical field names when building the actual API payload.

## What to Know Before Creating

Before calling the creation scripts, gather these from the user. Ask questions where the answer is unclear.

### Must know

- Product name: the display name on the storefront (max 255 chars)
- Product slug: URL identifier, only letters, numbers, hyphens, underscores (max 80 chars). Suggest one based on the name.
- Type: one-time, gift card, or subscription. Gift cards are technically one-time digital products with `giftCard.enabled: 1`.
- Physical or digital: determines if shipping address is collected. Cannot be changed after creation. Passed as `digital: 0` (physical) or `digital: 1` (digital). Gift cards are always digital.

### Should know

- Description: HTML or plain text shown on the product page
- Images: up to 5 image URLs. Passed as `images: { create: [{ url, order }] }`
- Tags: for categorization and filtering. Passed as `tags: { create: [{ value }] }`

### For one-time products

- Variant price: in cents (1999 = $19.99). At least one variant is required.
- Variant options: up to 3 name/value pairs per variant (e.g. Size/Small, Color/Blue)
- Whether gifting is enabled: allows purchasing as a gift for someone else

### For gift cards

- Denomination amounts: each variant is a voucher value the customer can buy (e.g. $25, $50, $100). At least one denomination is required.
- Expiration: how many months until the voucher expires (1 to 36), or no expiration

### For subscription products

- Billing frequency: `frequencyUnit` (day, week, month) and `frequencyCount` (how many units per cycle)
- Plan price: in cents, per billing cycle
- Billing type (physical only): independent (adhoc) or synchronized (anchored). See `references/subscription-scheduling.md`.
- Shipment frequency (physical only): coherent (one shipment per cycle) or incoherent/prepaid (multiple shipments per cycle)
- Setup fee: optional one-time fee on first order, in cents
- Whether pause is enabled: lets subscribers pause and resume
- Trial: optional trial price and duration in days. Not available with anchored billing.
- Commitment (`commitmentBillingCount`): minimum number of billing cycles the subscriber must complete before they can cancel. This is not related to prepaid/shipment frequency, it only controls cancellation eligibility.
- Charges limit (`chargesLimit`): optional maximum number of billing cycles (subscription auto-expires after this)

## Creating the Product

Products are created as drafts. They must be published separately to appear on the storefront.

All prices are integers in cents. Always confirm this with the user to avoid mistakes (e.g. passing 20 instead of 2000 for $20).

Slugs must be unique across the store. If creation fails with a slug conflict, suggest an alternative.
