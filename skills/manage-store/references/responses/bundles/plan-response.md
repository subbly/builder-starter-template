# Bundle Plan Response

```ts
interface BundlePlan {
  id: number;
  plan?: Plan;
  variant?: Variant;
  prices?: BundlePrice[];
  discounts?: BundleDiscount[];
  createdAt: string;
  updatedAt?: string;
}
```
