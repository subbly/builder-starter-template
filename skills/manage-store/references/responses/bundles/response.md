# Bundle Response

Return type for:
- `bundles.list` (`PaginatedResponse<Bundle>`)
- `bundles.get` (`Bundle`)
- `bundles.create` (`Bundle`)
- `bundles.update` (`Bundle`)
- `bundles.publish` (`Bundle`)
- `bundles.unpublish` (`Bundle`)
- `bundles.archive` (`Bundle`)
- `bundles.metadata` (`Bundle`)

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
  rulesetType?: 'total' | 'quantity' | null;
  appearanceType?: 'one_step' | 'two_step' | 'without_ruleset' | 'after_checkout' | null;
  rulesets?: BundleRuleset[];
  plans?: BundlePlan[];
  preferences?: BundlePreference[];
  filters?: BundleFilter[];
  discounts?: BundleDiscount[];
  prices?: BundlePrice[];
  setupFee?: number | null;
  giftingEnabled: boolean;
  pauseEnabled: boolean;
  preOrderEndAt?: string | null;
  funnelId?: number | null;
  collectShippingAddress?: boolean | null;
  tags: string[];
  published: boolean;
  itemsCount: number;
  plansCount: number;
  rulesetsCount: number;
  metadata?: unknown[] | null;
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
  minTotal?: number | null;
  maxTotal?: number | null;
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
  /** @deprecated -> use metafieldId */
  attributeId?: number;
  metafieldId: number;
  values: BundlePreferenceValue[];
  createdAt: string;
  updatedAt?: string;
}

interface BundlePreferenceValue {
  id: number;
  value: string;
  name: string;
}

interface BundleFilter {
  id: number;
  title: string;
  /** @deprecated -> use metafieldId */
  attributeId?: number;
  metafieldId: number;
  values: BundleFilterValue[];
  createdAt: string;
  updatedAt?: string;
}

interface BundleFilterValue {
  id: number;
  value: string;
  name: string;
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
