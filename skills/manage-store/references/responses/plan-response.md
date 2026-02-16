# Plan Response

Return type for `products.getPlan` (`Plan`).

```ts
interface Plan {
  id: number;
  bundlePlanId?: number | null;
  bundlePlan?: BundlePlan | null; // expandable → see bundle-response.md
  name: string;
  pricingName: string;
  description?: string | null;
  price: number;
  priceSchema?: PriceSchema;
  parent?: SubscriptionProduct; // expandable → see product-response.md
  frequencyUnit: 'day' | 'month' | 'year';
  frequencyCount: number;
  anchored: boolean;
  trialPrice?: number | null;
  trialLength?: number | null;
  trialSingleOrder: boolean;
  chargeImmediately: boolean;
  shipImmediately: boolean;
  rebillingStartAt?: string | null;
  cutOffAt?: string | null;
  cutOffTime?: string | null;
  stockCount?: number | null;
  setupFee?: number | null;
  preOrderEndAt?: string | null;
  shippings?: ProductShipping[];
  metadata?: Metadata[] | null; // expandable → see metafield-response.md
  survey?: Survey | null; // expandable → see survey-response.md
  commitmentBillingCount: number;
  chargesLimit?: number | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
```
