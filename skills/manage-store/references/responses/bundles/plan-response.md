# Bundle Plan Response

Return type for:
- `bundles.plans.get` (`BundlePlan`)
- `bundles.plans.create` (`BundlePlan`)
- `bundles.plans.update` (`BundlePlan`)
- `bundles.plans.archive` (`BundlePlan`)

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
