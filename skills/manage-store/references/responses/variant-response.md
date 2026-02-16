# Variant Response

Return type for `products.getVariant` (`Variant`).

```ts
interface Variant {
  id: number;
  bundlePlanId?: number | null;
  bundlePlan?: BundlePlan | null; // expandable → see bundle-response.md
  name: string;
  description?: string | null;
  price: number;
  priceSchema?: PriceSchema;
  parent?: OneTimeProduct; // expandable → see product-response.md
  metadata?: Metadata[] | null; // expandable → see metafield-response.md
  attributes?: Metadata[]; // @deprecated → use metadata
  options?: ProductOption[];
  stockCount?: number | null;
  published: boolean;
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
