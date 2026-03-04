# Bundle Group Response

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
