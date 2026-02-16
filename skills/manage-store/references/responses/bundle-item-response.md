# Bundle Item Response

Return type for `bundles.listItems` (`PaginatedResponse<BundleItem>`) and `bundles.getItem` (`BundleItem`).

```ts
interface BundleItem {
  id: number;
  productId?: number; // @deprecated → use variantId
  bundleId: number;
  variantId: number;
  product?: Variant; // @deprecated → use variant
  variant?: Variant; // expandable (supports variant.metadata)
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
