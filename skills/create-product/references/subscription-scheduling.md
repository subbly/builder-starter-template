# Subscription Plan Scheduling

Technical detail for physical subscription plan scheduling via `products/plans/create.js`.

## Billing Types

Determined by whether `rebillingDay*` fields are set on the plan.

### Independent Cycles (Adhoc Billing)

No `rebillingDay*` fields set. Each subscriber's billing rolls independently from their signup date. `chargeImmediately` is forced to 1.

Trials are allowed (`trialPrice`, `trialLengthDays`, `trialSingleOrder`).

#### Shipping in Adhoc Billing

Adhoc billing supports two shipment schedule formats. All entries in the `shipmentSchedule` array must use the same format.

Buffered shipping offsets shipment dates from the billing start:

- `addUnit`: time unit to offset (day/week/month, limited by `frequencyUnit`)
- `addCount`: how many units to offset (-1 = ship day before next cycle)

<example>
Adhoc, buffered shipping, coherent. Monthly coffee subscription, ships 5 days after billing.
frequencyUnit: "month", frequencyCount: 1
shipmentSchedule: [{ addUnit: "day", addCount: 5 }]
Subscriber signs up Jan 10 → billed Jan 10, ships Jan 15. Next bill Feb 10, ships Feb 15.
</example>

Anchored shipping pins shipments to fixed days within the billing period:

- `unitDay`: day within the frequency unit to ship (1 to 31 for month, 1 to 7 for week)
- `unitOffset`: which iteration within the billing period (0 to `frequencyCount` - 1)

When using anchored shipping, `cutOffDays` and `cutOffTime` become available. `cutOffDays` is the number of days before the first shipment date, giving the merchant preparation time. Shipments that fall within the cutoff window are rolled forward individually; billing is unaffected.

Because adhoc billing dates are not fixed to a calendar day, cutoff affects both the initial signup and renewals. On each renewal the system checks which shipments in the new cycle fall within the cutoff window and defers them individually.

<example>
Adhoc, anchored shipping, coherent. Monthly box, always ships on the 15th.
frequencyUnit: "month", frequencyCount: 1
shipmentSchedule: [{ unitDay: 15, unitOffset: 0 }]
cutOffDays: 5
Subscriber signs up Jan 8 → ships Jan 15 (signed up before cutoff of Jan 10). Subscriber signs up Jan 12 → misses Jan 15 cutoff, ships Feb 15 instead.
</example>

`anchorDate` (set to `"today"`) pins all subscribers to the same shipping period boundaries regardless of signup date. Requires `frequencyCount` > 1. Without it, shipping dates are relative to each subscriber's billing date. When a subscriber signs up after a shipment's cutoff has passed within the current period, that shipment is deferred to the next eligible anchored shipment slot in the following shipping period.

<example>
Adhoc, anchored shipping with anchorDate, incoherent/prepaid. Quarterly billing, monthly shipping.
frequencyUnit: "month", frequencyCount: 3, anchorDate: "today"
shipmentSchedule: [
  { unitDay: 1, unitOffset: 0 },
  { unitDay: 1, unitOffset: 1 },
  { unitDay: 1, unitOffset: 2 }
]
cutOffDays: 5
Customer pays once every 3 months, receives a shipment on the 1st of each month. All subscribers share the same period boundaries because of anchorDate.
</example>

<example>
Adhoc, anchored shipping with anchorDate, incoherent/prepaid. Annual billing, quarterly shipping. Showing per-shipment deferral.
frequencyUnit: "month", frequencyCount: 12, anchorDate: "today" (set Jan 1)
shipmentSchedule: [
  { unitDay: 15, unitOffset: 2 },
  { unitDay: 15, unitOffset: 5 },
  { unitDay: 15, unitOffset: 8 },
  { unitDay: 15, unitOffset: 11 }
]
cutOffDays: 14
Shipment dates: Mar 15, Jun 15, Sep 15, Dec 15. Cutoffs: Mar 1, Jun 1, Sep 1, Dec 1.
Subscriber signs up Jan 1 → before all cutoffs, receives all 4 shipments: Mar 15, Jun 15, Sep 15, Dec 15.
Subscriber signs up Jun 5 → after Mar 1 and Jun 1 cutoffs. Mar 15 and Jun 15 shipments deferred individually to next period (Mar 15 and Jun 15 next year). Receives Sep 15 and Dec 15 this period.
</example>

### Synchronized Cycles (Anchored Billing)

`rebillingDay*` fields are set. Bills on a fixed calendar day (e.g. 1st of month, every Monday).

`cutOffDays`/`cutOffTime` are required. `cutOffDays` is the number of days before the first shipment date in the cycle. Cutoff only affects the initial purchase. If a subscriber signs up after the cutoff, the entire billing cycle defers. Once subscribed, billing happens on the fixed calendar day regardless of cutoff.

When a subscriber signs up after the billing date but before the cutoff, the billing date is already in the past. The system charges immediately regardless of the `chargeImmediately` setting.

`anchorDate` determines the anchoring mode:

#### Any Month/Week During a Cycle (Soft Anchored)

No `anchorDate` set. Subscribers bill on a fixed day but their cycle boundaries are independent. Daily frequency is prohibited, only week/month allowed.

<example>
Soft anchored, coherent. Monthly plan, bills on the 1st.
frequencyUnit: "month", frequencyCount: 1
rebillingDayOfMonth: 1
shipmentSchedule: [{ unitDay: 5, unitOffset: 0 }]
cutOffDays: 3
Subscriber signs up Dec 28 → before cutoff (Jan 1 minus 3 days = Dec 29). Billed Jan 1, ships Jan 5.
Subscriber signs up Dec 30 → after cutoff. Entire cycle defers to Feb 1.
Subscriber signs up Jan 2 → after billing date (1st) but before cutoff (Jan 5 minus 3 = Jan 2). Forces charge immediately, ships Jan 5.
</example>

#### Beginning of a New Cycle (Hard Anchored)

`anchorDate` is set. All subscribers share the same billing period boundaries. No partial cycles. If a subscriber signs up after the cutoff, the entire billing cycle is deferred to the next cycle. Requires `frequencyCount` > 1. Daily frequency requires `frequencyCount` >= 2.

<example>
Hard anchored, coherent. Bimonthly plan, all subscribers synchronized.
frequencyUnit: "month", frequencyCount: 2, anchorDate: "2025-01-01"
rebillingDayOfMonth: 1
shipmentSchedule: [{ unitDay: 10, unitOffset: 0 }]
cutOffDays: 5
All subscribers share the same cycle: Jan 1 to Mar 1. Subscriber signs up Jan 15 → after billing date but before cutoff (Feb 10 minus 5 = Feb 5), forces charge immediately, ships Feb 10. Subscriber signs up Feb 8 → after cutoff, entire cycle defers to Mar 1.
</example>

<example>
Hard anchored, incoherent/prepaid, showing entire cycle deferral. Quarterly billing, monthly shipping.
frequencyUnit: "month", frequencyCount: 3, anchorDate: "2025-01-01"
rebillingDayOfMonth: 1
shipmentSchedule: [
  { unitDay: 10, unitOffset: 0 },
  { unitDay: 10, unitOffset: 1 },
  { unitDay: 10, unitOffset: 2 }
]
cutOffDays: 5
Cycle: Jan 1 to Apr 1. Cutoff: Dec 27 (Jan 1 minus 5 days).
Subscriber signs up Dec 20 → before cutoff. Billed Jan 1, ships Jan 10, Feb 10, Mar 10.
Subscriber signs up Dec 29 → after cutoff. Entire cycle defers to Apr 1. Billed Apr 1, ships Apr 10, May 10, Jun 10. All 3 shipments move together, not individually like in adhoc.
</example>

Trials are not available with anchored billing.

#### Shipping in Anchored Billing

Anchored billing only supports anchored shipping format:

- `unitDay`: day within the frequency unit to ship (1 to 31 for month, 1 to 7 for week)
- `unitOffset`: which iteration within the billing period (0 to `frequencyCount` - 1)

All entries in the `shipmentSchedule` array must use the same format.

<example>
Hard anchored, incoherent/prepaid. Quarterly billing, monthly shipping, synchronized.
frequencyUnit: "month", frequencyCount: 3, anchorDate: "2025-01-01"
rebillingDayOfMonth: 1
shipmentSchedule: [
  { unitDay: 10, unitOffset: 0 },
  { unitDay: 10, unitOffset: 1 },
  { unitDay: 10, unitOffset: 2 }
]
cutOffDays: 5
Customer pays Jan 1, receives shipments on Jan 10, Feb 10, Mar 10. Next bill Apr 1.
</example>

## Shipment Frequency

A subscription plan can have multiple entries in the `shipmentSchedule` array. Each entry defines a separate shipment within a single billing cycle.

When billing and shipping happen at the same cadence (e.g. bill monthly, ship monthly) the plan has one shipment entry per cycle. This is a coherent schedule.

When billing and shipping frequencies are mismatched, the schedule is incoherent. The customer is billed less often than they receive shipments. For example a plan that bills every 3 months (`frequencyUnit: "month"`, `frequencyCount: 3`) but ships once per month would have 3 entries in `shipmentSchedule`. This is effectively a prepaid model where the customer pays upfront for multiple deliveries.

The number of `shipmentSchedule` entries determines how many shipments occur per billing cycle. Each entry uses `unitOffset` (0 to `frequencyCount` - 1) to specify which iteration within the cycle it belongs to.

### Rebilling Day Fields

Mutually exclusive. Use one based on the `frequencyUnit`:

- `rebillingDay`: for daily frequency (must be 1)
- `rebillingDayOfMonth`: for monthly frequency (1 to 31, must match `anchorDate` day if set)
- `rebillingDayOfWeek`: for weekly frequency (1 to 7 ISO, must match `anchorDate` weekday if set)

## Field Availability

Fields available per configuration:

```
                          | Digital | Adhoc (buffered) | Adhoc (anchored ship) | Anchored
──────────────────────────+─────────+──────────────────+───────────────────────+──────────
shipmentSchedule          |    no   |       yes        |          yes          |    yes
anchorDate                |    no   |        no        |       optional        | optional
rebillingDay*             |    no   |        no        |           no          |    yes
cutOffDays/cutOffTime     |    no   |        no        |          yes          |    yes
chargeImmediately         |    no   |        =1        |           =1          |   0 or 1
shipImmediately           |  0 or 1 |      0 or 1      |        0 or 1         |   0 or 1
bufferDays                |    no   |       yes        |          yes          |    yes
trialPrice/trialLength    |   yes   |       yes        |          yes          |     no
trialSingleOrder          |    no   |       yes        |          yes          |     no
addUnit/addCount ship     |    no   |       yes        |           no          |     no
unitDay/unitOffset ship   |    no   |        no        |          yes          |    yes
```
