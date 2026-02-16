# Product Response

Return type for `products.list` (`PaginatedResponse<Product>`) and `products.get` (`Product`).

```ts
interface Product {
  id: number;
  bundleId?: number | null;
  bundle?: Bundle | null; // expandable → see bundle-response.md
  bundleRulesetId?: number | null;
  bundleRuleset?: BundleRuleset | null; // expandable → see bundle-response.md
  slug: string;
  type: 'one_time' | 'subscription';
  name: string;
  description?: string | null;
  deliveryInfo?: string | null;
  collectShippingAddress: boolean;
  giftingEnabled: boolean;
  digital: boolean;
  images?: ProductImage[];
  tags: string[];
  published: boolean;
  metadata?: Metadata[] | null; // expandable → see metafield-response.md
  createdAt: string;
  updatedAt: string;
}

interface OneTimeProduct extends Product {
  type: 'one_time';
  giftCard: boolean;
  giftCardExpiration?: number | null;
  variants?: Variant[]; // expandable → see variant-response.md
  options?: ProductOptionGroup[];
}

interface SubscriptionProduct extends Product {
  type: 'subscription';
  plans?: Plan[]; // expandable → see plan-response.md
  pricings?: Plan[] | null; // @deprecated → use plans
}

interface ProductImage {
  id: number;
  url: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductOptionGroup {
  id: number;
  name: string;
  values: string[];
}

interface ProductOption {
  id: number;
  name: string;
  value: string;
}

interface ProductShipping {
  id: number;
  shippingAt?: string | null;
  addCount?: number | null;
  addUnit?: 'day' | 'month' | 'year' | null;
  createdAt: string;
  updatedAt?: string;
}
```
