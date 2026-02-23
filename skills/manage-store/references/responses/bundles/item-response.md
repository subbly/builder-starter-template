# Bundle Item Response

Return type for `bundles.listItems` (`PaginatedResponse<BundleItem>`) and `bundles.getItem` (`BundleItem`).

```ts
interface BundleItem {
  id: number;
  /** @deprecated → use variantId */
  productId?: number;
  bundleId: number;
  variantId: number;
  /** @deprecated → use variant. @expand */
  product?: Variant;
  /** @expand (supports variant.metadata) */
  variant?: Variant;
  settings: BundleItemSetting[];
  createdAt: string;
  updatedAt?: string;
}

interface BundleItemSetting {
  id: number;
  name: string;
  value: string;
}
```
