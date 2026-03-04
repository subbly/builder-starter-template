# Variant Response

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

interface VariantBatchResponse {
  create: Variant[];
  update: Variant[];
  delete: Variant[];
}
```

`VariantBatchResponse`: all three keys are always present. Each returns full `Variant` entities — including `delete`, which returns the archived variants in their final state.
