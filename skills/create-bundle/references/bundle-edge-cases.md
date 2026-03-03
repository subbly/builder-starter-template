# Bundle Edge Cases

Use this checklist when creating or updating bundles.

## Type-switch resets

These behaviors come from private API update listeners and are easy to miss.

- Changing `rulesetType`:
  - Existing active rulesets are reset by position to the new type defaults (`quantity` or `total` shape)
  - Existing bundle prices and discounts are archived
- Changing `priceType`:
  - `null -> value`: default price entries are created for every active ruleset x active plan (`quantity: 1`, `amount: 0`)
  - `value -> null`: all bundle prices are archived
  - `value A -> value B`: prices are archived and recreated with defaults
- Changing `discountType`:
  - `null -> value`: default discount entries are created for every active ruleset x active plan
  - `value -> null`: all bundle discounts are archived
  - Only switching between percentage and non-percentage triggers archive+recreate

## Coupled update fields

- Updating `discountType` requires including `priceType` in the same payload
- Updating `rulesetType` requires including `priceType` in the same payload
- You cannot update `rulesets` in the same request where `rulesetType` is sent

## Item-level constraints

Bundle items must be valid one-time variants:
- not archived
- not a gift card
- not duplicated inside the same bundle

Other item constraints:
- batch item create max is 200 items
- deleting items is blocked when bundle would drop below minimum required count

## Publish/archive constraints

- Bundle publish also publishes all unarchived bundle plans
- Bundle archive is blocked when bundle has active subscriptions
- Bundle plan archive is blocked when:
  - it is the last active plan
  - it has active subscriptions

## Subscription-plan constraints

For bundle plans of `type: subscription`:
- digital bundles cannot use shipping schedule, anchored billing fields, or charge-immediately controls

## Plan immutable fields

The following plan fields cannot be changed after creation:
- `type` (`one_time` vs `subscription`)
- `frequencyUnit`
- `frequencyCount`

## Other common pitfalls

- Physical bundles must keep `collectShippingAddress=1`
- Bundle filters allow at most one active filter
- If merchant plan does not allow optional pause, `pauseEnabled` can only be `1`
