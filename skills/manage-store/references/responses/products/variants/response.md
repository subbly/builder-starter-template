# Variant Response

Return type for `products.variants.get` (`Variant`).

```ts
interface Variant {
  id: number;
  bundlePlanId?: number | null;
  /** @expand → bundles/response.md */
  bundlePlan?: BundlePlan | null;
  name: string;
  description?: string | null;
  price: number;
  priceSchema?: PriceSchema;
  /** @expand → products/response.md */
  parent?: OneTimeProduct;
  metadata?: Metadata[] | null;
  /** @deprecated → use metadata */
  attributes?: Metadata[];
  options?: ProductOption[];
  stockCount?: number | null;
  published: boolean;
  inventoryItemId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PriceSchema {
  i: number;
  type: 'flat_price' | 'volume';
  amount?: number | null;
  ranges?: PriceSchemaRange[];
  createdAt: string;
  updatedAt?: string;
}

interface PriceSchemaRange {
  id: number;
  range: number;
  amount: number;
  createdAt: string;
  updatedAt?: string;
}
```
