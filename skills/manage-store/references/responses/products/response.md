# Product Response

Return type for `products.list` (`PaginatedResponse<Product>`) and `products.get` (`Product`).

```ts
interface Product {
  id: number;
  bundleId?: number | null;
  /** @expand → bundles/response.md */
  bundle?: Bundle | null;
  bundleRulesetId?: number | null;
  bundleRuleset?: BundleRuleset | null;
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
  archived: boolean;
  metadata?: Metadata[] | null;
  createdAt: string;
  updatedAt: string;
}

interface OneTimeProduct extends Product {
  type: 'one_time';
  giftCard: boolean;
  giftCardExpiration?: number | null;
  /** @expand → products/variants/response.md */
  variants?: Variant[];
  options?: ProductOptionGroup[];
  funnelId?: number | null;
  taxProductCode?: string | null;
  variantsCount?: number;
}

interface SubscriptionProduct extends Product {
  type: 'subscription';
  /** @expand → products/plans/response.md */
  plans?: Plan[];
  setupFee?: number | null;
  preOrderEndAt?: string | null;
  pauseEnabled: boolean;
  inventoryItemId?: number | null;
  funnelId?: number | null;
  taxProductCode?: string | null;
  plansCount?: number;
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
