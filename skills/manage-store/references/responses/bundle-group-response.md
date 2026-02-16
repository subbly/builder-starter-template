# Bundle Group Response

Return type for `bundles.listGroups` (`PaginatedResponse<BundleGroup>`).

```ts
interface BundleGroup {
  id: number;
  bundleId: number;
  name: string;
  description?: string | null;
  minQuantity: number;
  maxQuantity?: number | null;
  position: number;
  createdAt: string;
  updatedAt?: string;
}
```
