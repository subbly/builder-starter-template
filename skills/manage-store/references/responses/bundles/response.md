# Bundle Response

Return type for `bundles.list` (`PaginatedResponse<Bundle>`) and `bundles.get` (`Bundle`).

```ts
interface Bundle {
  id: number;
  name: string;
  slug: string;
  digital: boolean;
  deliveryInfo?: string | null;
  configurable: boolean;
  images?: BundleImage[];
  description?: string | null;
  hiddenItems: boolean;
  searchable: boolean;
  showRulesetName: boolean;
  quantitySelectors: number[];
  selectionType?: 'variant' | 'product' | 'single_product' | null;
  discountType?: 'per_item' | 'total' | 'percentage' | null;
  priceType?: 'per_item' | 'total' | null;
  rulesetType: 'total' | 'quantity';
  appearanceType: 'one_step' | 'two_step' | 'without_ruleset' | 'after_checkout';
  rulesets?: BundleRuleset[];
  plans?: BundlePlan[];
  preferences?: BundlePreference[];
  filters?: BundleFilter[];
  discounts?: BundleDiscount[];
  prices?: BundlePrice[];
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface BundleImage {
  id: number;
  url: string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

interface BundleRuleset {
  id: number;
  name: string;
  minQuantity: number;
  maxQuantity?: number | null;
  ctaText?: string | null;
  products?: (OneTimeProduct | SubscriptionProduct)[];
  createdAt: string;
  updatedAt?: string;
}

interface BundlePlan {
  id: number;
  plan?: Plan;
  variant?: Variant;
  prices?: BundlePrice[];
  discounts?: BundleDiscount[];
  createdAt: string;
  updatedAt?: string;
}

interface BundlePreference {
  id: number;
  title: string;
  /** @deprecated → use metafieldId */
  attributeId?: number;
  metafieldId: number;
  values: BundlePreferenceValue[];
  createdAt: string;
  updatedAt?: string;
}

interface BundlePreferenceValue {
  id: number;
  title: string;
}

interface BundleFilter {
  id: number;
  title: string;
  /** @deprecated → use metafieldId */
  attributeId?: number;
  metafieldId: number;
  values: BundleFilterValue[];
  createdAt: string;
  updatedAt?: string;
}

interface BundleFilterValue {
  id: number;
  title: string;
}

interface BundleDiscount {
  id: number;
  rulesetId: number;
  planId: number;
  ranges: BundleDiscountRange[];
  createdAt: string;
  updatedAt?: string;
}

interface BundleDiscountRange {
  range: number;
  amountOff?: number | null;
  percentOff?: number | null;
}

interface BundlePrice {
  id: number;
  rulesetId: number;
  planId: number;
  ranges: BundlePriceRange[];
  createdAt: string;
  updatedAt?: string;
}

interface BundlePriceRange {
  range: number;
  amount?: number | null;
}
```
