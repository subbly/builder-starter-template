# Plan Response

Return type for `products.plans.get` (`Plan`).

```ts
interface Plan {
  id: number;
  bundlePlanId?: number | null;
  /** @expand → bundles/response.md */
  bundlePlan?: BundlePlan | null;
  name: string;
  pricingName: string;
  description?: string | null;
  price: number;
  priceSchema?: PriceSchema;
  /** @expand → products/response.md */
  parent?: SubscriptionProduct;
  frequencyUnit: 'day' | 'week' | 'month';
  frequencyCount: number;
  anchored: boolean;
  anchorDate?: string | null;
  rebillingDay?: number | null;
  rebillingDayOfWeek?: number | null;
  rebillingDayOfMonth?: number | null;
  trialPrice?: number | null;
  trialLength?: number | null;
  trialSingleOrder: boolean;
  chargeImmediately: boolean;
  shipImmediately: boolean;
  bufferDays?: number | null;
  rebillingStartAt?: string | null;
  cutOffAt?: string | null;
  cutOffDays?: number | null;
  cutOffTime?: string | null;
  stockCount?: number | null;
  setupFee?: number | null;
  preOrderEndAt?: string | null;
  shippings?: ProductShipping[];
  metadata?: Metadata[] | null;
  survey?: Survey | null;
  commitmentBillingCount: number;
  chargesLimit?: number | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
```
