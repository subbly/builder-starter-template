# Bundle Item Response

```ts
interface BundleItem {
  id: number;
  /** @deprecated -> use variantId */
  productId: number;
  variantId: number;
  /** @deprecated -> use variant. Expandable */
  product?: Variant | null;
  /** Expandable */
  variant?: Variant | null;
  settings: BundleItemSetting[];
  extraPrice?: number | null;
  stockCount?: number | null;
  quantity?: number | null;
  position?: number | null;
  createdAt: string;
  updatedAt?: string;
}

interface BundleItemSetting {
  id: number;
  rulesetId: number;
  maxQuantity: number;
  createdAt: string;
  updatedAt?: string;
}

interface BatchBundleItemsResponse {
  create: BundleItem[];
}
```
