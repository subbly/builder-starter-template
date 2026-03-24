---
name: manage-product
description: "Guide for creating and updating Subbly products and bundles via the Private API. Use when the user wants to create a one-time, gift card, or subscription product, add variants or plans, and publish. Also use when the user wants to create or update a fixed or configurable bundle, manage items and plans, configure tiers (rulesets), prices, and discounts, and publish. A bundle is a specific product type for selling fixed curated boxes, configurable build-your-own boxes, or subscribe-and-save offers. Covers product types, bundle modes, field meanings, and edge cases before running scripts."
---

# Manage Product

Guide for creating products and bundles in the Subbly store via the Private API. Use `manage-store` skill for execution details and param schemas.

## Talking to the User

When discussing product setup, use business language. Do not show JSON, field names, or script arguments until building the final payload. Say "ships on the 15th of each month" not `unitDay: 15`. Say "customers can pick up to 3 items" not `settings.create[].maxQuantity`.

Avoid using internal technical aliases in parentheses when communicating. The parenthetical forms exist only for internal reference in this document and its references.

### Terminology Map

Merchants use different words depending on their niche. Map these to the correct internal concept.

**Product**: item, listing, good, offering
**Bundle**: box, subscription box, kit, pack, crate, bag, set, collection, offer
**Bundle items**: items, products, servings, pieces, meals, recipes, treats, samples, picks, slots, selections, snacks
**Tiers (rulesets)**: box sizes, bundle size, sizes (small / medium / large), tiers, levels, packs, options (e.g. "6-item box", "12-item box")
**Gift card**: gift voucher, gift certificate, e-gift card, store credit

## Product Types

Two API-level product types: `one_time` and `subscription`. The type is determined by which creation script is called and cannot be changed after creation.

### One-Time Products

A one-time product is a single purchase. The customer buys it once and receives it.

One-time products use variants for pricing. Every one-time product needs at least one variant to be purchasable, even if there is only one option (a "default" variant with just a price).

Can be physical or digital. Physical products collect a shipping address at checkout, digital products skip shipping.

If all variants on a one-time product are archived, the system automatically creates a default variant with no options (just a price). This means a product always remains purchasable as long as it is published.

### Gift Cards (Gift Vouchers)

A gift card is a one-time digital product with `giftCard.enabled: 1`. It is always digital.

When a customer buys a gift card they receive a gift voucher for a specific amount of money. They can send this voucher to someone else and the recipient can use it to purchase items in the store. The voucher balance covers the cost at checkout.

Variants on a gift card act as denominations. Each variant represents a different voucher value the customer can choose to buy. For example a gift card product might have three variants: $25, $50, and $100. The variant price is the voucher amount. At least one denomination variant is required.

Gift cards have an optional expiration set via `giftCard.expiration` (1 to 36 months). If not set the gift voucher does not expire.

Gift cards are created using `products.oneTime.create` with `giftCard: { enabled: 1 }` and optionally `giftCard: { enabled: 1, expiration: N }` where N is months. The gift card flag implies digital.

### Subscription Products

A subscription product bills the customer on a recurring schedule.

Subscription products use plans instead of variants. Each plan defines a billing frequency (e.g. every 1 month, every 2 weeks) and a price per cycle. A subscription product needs at least one plan.

Can be physical or digital. Supports setup fees, pause/resume, trials, and commitment periods, all configured on the plan level.

Digital subscriptions are memberships. They have no physical shipping so the following plan fields are prohibited: `shipmentSchedule`, `anchorDate`, `rebillingDay*`, `cutOffDays`, `cutOffTime`, `chargeImmediately`, `trialSingleOrder`. Billing rolls from the subscriber's signup date.

Physical subscriptions require a `shipmentSchedule` on the plan. They support two billing types:

- Independent cycles (adhoc): each subscriber's billing rolls from their own signup date
- Synchronized cycles (anchored): all subscribers bill on a fixed calendar day

Shipments always happen after billing. A physical subscription can have multiple shipments per billing cycle. When billing and shipping happen at the same cadence the schedule is coherent. When mismatched (bill every 3 months, ship monthly) the schedule is incoherent/prepaid.

## Bundle Types

A bundle is a specific product type for selling multiple items together. A bundle can be fixed (`configurable: 0`) or configurable (`configurable: 1`).

### Fixed Bundles (`configurable: 0`)

A fixed bundle is a set of items sold together as one product/offer. The merchant decides the contents. Customers cannot select specific items, use preferences, or use filters. The price is flat and can only be tiered by bundle quantity in the cart.

Key behavior:
- `selectionType` is forced to `null`
- `priceType` is forced to `total`
- `rulesetType` cannot be set by user; backend defaults to `quantity`
- `showRulesetName`, `rulesetType`, `appearanceType`, `quantitySelectors`, `filters`, `preferences`, `rulesets` are not available
- Still gets a pre-created default tier (ruleset) in backend, used for plan price payloads

### Configurable Bundles (`configurable: 1`)

A configurable bundle is a build-box system: customers can customize using preferences, tiers (rulesets), flexible pricing, appearance types, and selection types.

### Selection Type

`selectionType` controls how the customer selects items:

- `variant`: customer selects variants from a flat list
- `product`: customer selects variants grouped by one-time product; multiple variants per group. Most common in production stores.
- `single_product`: customer picks one variant per product from a fixed set of products. Like a build-a-box with a strict rule: one choice per product. Example: toothbrush (red/yellow) + toothpaste (mint/cola). Customer picks one of each. Can have one-time plans, subscription plans, or both. A `single_product` bundle can also wrap just one product if that product has multiple option groups (up to 3). The customer picks one variant combination. This is common when options like box size and preference are both attributes of the same box. Do not confuse multiple option selectors on screen with multiple products.

## Determine Product Type

### Gift Card Pre-Check

If the user mentions gift card, gift voucher, gift certificate, or store credit, this is a **Gift card**. Skip the decision matrix and read `product.md`.

### Signals

Gather three signals from the user. Frame them as business-language questions. If the user's description does not give enough information to determine all signals, ask about their product setup before applying the matrix.

1. **Billing**: How will the customer pay?
   - `one-time`: single purchase
   - `subscription`: recurring billing
   - `both`: customer can choose either option

2. **Curation**: Who decides what goes in the order?
   - `merchant`: the merchant picks the items
   - `customizes a fixed set`: customer picks from a set of products, each with its own variant options
   - `builds the box`: customer freely selects items to fill a box

   If curation is `merchant`, ask: how many distinct items?
   - `single item`: one product (may have variants like size or color)
   - `multiple items`: a set of products sold together

3. **Options**: Does the customer pick product options (size, flavor, color)?
   - Only relevant when curation = merchant + single item. For all other combinations, the billing and curation signals are sufficient.

   If options = yes and the result is a Single product bundle, ask a follow-up: are these options all attributes of the same item, or are they separate items?
   - `same item` (e.g. size + flavor of one box): one product with multiple option groups (up to 3). The bundle wraps a single product.
   - `separate items` (e.g. pick a toothbrush AND pick a toothpaste): multiple products, one per item. Each becomes a bundle item.

### Decision Matrix

| billing      | curation                 | options | Result                |
|--------------|--------------------------|---------|-----------------------|
| one-time     | merchant, single item    | no      | One-time product      |
| one-time     | merchant, single item    | yes     | One-time product      |
| one-time     | merchant, multiple items | -       | Fixed bundle          |
| one-time     | customizes a fixed set   | -       | Single product bundle |
| one-time     | builds the box           | -       | Configurable bundle   |
| subscription | merchant, single item    | no      | Subscription product  |
| subscription | merchant, single item    | yes     | Single product bundle |
| subscription | merchant, multiple items | -       | Fixed bundle          |
| subscription | customizes a fixed set   | -       | Single product bundle |
| subscription | builds the box           | -       | Configurable bundle   |
| both         | merchant, single item    | -       | Single product bundle |
| both         | merchant, multiple items | -       | Fixed bundle          |
| both         | customizes a fixed set   | -       | Single product bundle |
| both         | builds the box           | -       | Configurable bundle   |

### Notes

**"both" always means a bundle.** Subbly products are locked to one type (one-time or subscription) at creation. Only bundles support multiple plan types on the same entity, so offering both purchasing options requires a bundle.

**"options" is only decisive in one case.** When billing is `subscription` and the merchant curates a single item, "no options" means a simple subscription product, while "yes, options" means a single product bundle (the bundle wrapper enables variant selection within a subscription). For everything else, billing and curation signals are sufficient.

After determining the result, read the corresponding reference before proceeding: `product.md` for products and gift cards, `bundle.md` for all bundle types.

## References

IMPORTANT: Read the corresponding reference file before creating or updating. References contain what to gather from the user, field constraints, and creation behavior.

|root: /project/workspace/skills/manage-product
|references/{product,bundle,subscription-scheduling}.md
