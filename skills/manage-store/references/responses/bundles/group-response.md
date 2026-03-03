# Bundle Group Response

Return type for `bundles.listGroups` (`PaginatedResponse<BundleGroup>`).

```ts
interface BundleGroup {
  id: number;
  productId: number;
  product?: OneTimeProduct | SubscriptionProduct | null;
  minQuantity: number;
  maxQuantity?: number | null;
  items: BundleItem[];
  createdAt: string;
  updatedAt?: string;
}
```
