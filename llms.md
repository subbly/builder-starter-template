# Subbly E-commerce Integration

This document explains how to integrate with the Subbly platform to retrieve product information and manage the shopping cart in your Next.js application.

## General Information

- By default you are using `addToCart` method from a `useSubblyCart` hook from the `@subbly/react` package, but users sometimes can ask to add a direct link to check. In that case use `buyLink` from `useBuyLink` hook from the `@subbly/react` package.
- All prices are defined in integers(cents), not decimals.
- When creating cart icon or cart counter, use these CSS classes to connect them with Subbly cart: `subbly-cart-product-count`, `subbly-cart`.
- These classes will automatically toggle cart widget and update cart counter when items are added or removed from the cart.
- If you see that in the existing code the cart icon or cart counter is not working, check if these classes are used and propose to add them.
- In VERY RARE CASES, you can update these classes inside `src/lib/subbly/subbly-script.tsx` file with the `cartToggleEl` and `cartCountEl` properties.

## Product Integration

This section explains how to integrate with the Subbly platform to retrieve product and bundle information.
`subblyApi` object provides methods to fetch information from Subbly storefront API.
`subblyApi` is initialized and exported from `/src/lib/subbly/index.ts`
`subblyApi` allows you to fetch products and product variants with proper typing for server-side operations.

Here is an example how to use `subblyApi` to fetch a list of products:

```typescript
import { subblyApi } from '@/lib/subbly'

subblyApi.product.list({
   page: 1,
   perPage: 12,
   type: 'subscription'
})
```

### Product API Quick Reference

```typescript
// Get a paginated list of products with filtering options
subblyApi.product.list(params: ProductsListParams, headers?: ProductRequestHeaders): Promise<ProductsListResponse>

// Get a single product by its numeric ID
subblyApi.product.byId(id: number, params?: ProductsResourceParams, headers?: ProductRequestHeaders): Promise<ParentProduct>

// Get a product by its URL-friendly slug (returns null if not found)
subblyApi.product.bySlug(slug: string, params?: ProductsListParams, headers?: ProductRequestHeaders): Promise<ParentProduct>

// Get a product variant by its numeric ID
subblyApi.product.variantById(variantId: number, params?: ProductsResourceParams, headers?: ProductRequestHeaders): Promise<ProductVariant>

// Get a product plan by its numeric ID
subblyApi.product.planById(productId: number, params?: ProductsResourceParams, headers?: ProductRequestHeaders): Promise<ProductPlan>

// Get a paginated list of bundles with filtering options
subblyApi.bundle.list(params?: BundleListParams, headers?: BundleRequestHeaders): Promise<BundleListResponse>

// Get a single bundle by its numeric ID
subblyApi.bundle.byId(bundleId: number, params?: BundleResourceParams, headers?: BundleRequestHeaders): Promise<Bundle>

// Get a bundle by its URL-friendly slug (returns null if not found)
subblyApi.bundle.bySlug(slug: string, params?: BundleListParams, headers?: BundleHeaders): Promise<Bundle>

// Get bundle groups for a specific bundle, applicable only when selectionType is product or single_product
subblyApi.bundle.listGroups(bundleId: number, params?: BundleGroupsParams, headers?: BundleHeaders): Promise<BundleGroupsResponse>
```

## Cart Integration

This section explains how to use the Subbly cart integration hook to add products to the cart in your Next.js application.

### Cart Functions

#### addToCart

Adds an item to the Subbly cart.

```typescript
async function addToCart(payload: ConfigureItemPayload): Promise<void>
```

#### updateCart

Updates the cart with new information.

```typescript
async function updateCart(payload: CartUpdatePayload): Promise<void>
```

### Cart API Quick Reference

```typescript
import { useSubblyCart } from '@subbly/react';

const { addToCart, updateCart } = useSubblyCart();

addToCart({
  productId: 123,
  quantity: 1
});

updateCart({
  couponCode: 'SAVE20'
});
```

## Core Types

Note: Most types used in this document can be imported from `@subbly/react` package.

```typescript
type ID = number

type Pagination = {
  currentPage: number
  from: number
  lastPage: number
  to: number
  total: number
}
```

## Pagination

The API uses cursor-based pagination for list endpoints. All list responses include a `pagination` object with the following properties:

- `currentPage`: The current page number (1-indexed)
- `from`: The starting item number on the current page
- `to`: The ending item number on the current page
- `lastPage`: The total number of pages available
- `total`: The total number of items across all pages

When making requests, you can control pagination using:

- `page`: The page number to retrieve (default: 1)
- `perPage`: Number of items per page (varies by endpoint, typically 10-100)

## Products

```typescript
enum ProductType {
  oneTime = 'one_time',
  subscription = 'subscription'
}

enum FrequencyUnit {
  day = 'day',
  week = 'week',
  month = 'month'
}

type ProductOption = {
  id: ID                      // Unique identifier
  name: string                // Option name (e.g., "Color", "Size")
  values: string[]            // Available values for this option
}

type ProductVariantOption = {
  id: ID
  name: string
  value: string
}

type ProductAttribute = {
  attributeId: ID
  id: ID
  name: string                // Name (e.g., "Color", "Size")
  value: string               // Value (e.g., "Red", "Large")
  valueId: ID
}

type ProductImage = {
  id: ID                      // Unique identifier
  url: string                 // Access URL
  order: number               // Display position
  createdAt: string
  updatedAt: string
}

type PriceSchemeRange = {
  amount: number              // Price at this quantity
  id: ID
  range: number               // Quantity threshold
}

type ProductPriceScheme = {
  id: ID
  type: 'volume_price' | string  // Pricing model
  ranges: PriceSchemeRange[]     // Volume pricing (if applicable)
}

type ProductShipping = {
  id: ID
  shippingAt: string | null
  addCount: number | null
  addUnit: FrequencyUnit
  createdAt: string
  updatedAt: string
}

type ProductVariant = {
  attributes: ProductAttribute[]
  bundlePlanId: BundlePlan['id'] | null
  createdAt: string
  description: string | null
  id: ID
  name: string
  options: ProductVariantOption[]
  parent: ProductOneTime
  price: number
  priceScheme: ProductPriceScheme | null
  stockCount: number | null   // null = unlimited
}

type ProductPlan = {
  bundlePlanId: BundlePlan['id'] | null
  chargeImmediately: boolean
  chargesLimit: number | null // The number of times the product plan will be charged. null = unlimited
  commitmentBillingCount: number
  createdAt: string
  cutOffAt: string | null
  description: string | null
  frequencyCount: number
  frequencyUnit: FrequencyUnit
  id: number
  name: string
  parent: ProductSubscription
  price: number
  priceScheme: ProductPriceScheme | null
  pricingName: string | null
  rebillingStartAt: string | null
  shipImmediately: boolean
  setupFee: number | null
  shippings: ProductShipping[]
  stockCount: number | null   // null = unlimited
  survey: Survey | null
  trialPrice: number | null
  trialLength: number | null
  trialLengthDays: number | null
}

type ProductOneTime = {
  bundle: Bundle | null
  bundleId: Bundle['id'] | null
  bundleRulesetId: BundleRuleset['id'] | null
  collectShippingAddress: boolean
  createdAt: string
  deliveryInfo: string | null
  description: string | null
  digital: boolean            // Digital vs physical product
  giftingEnabled: boolean     // Determines if the product can be purchased as a gift
  id: ID
  images: ProductImage[]
  name: string
  slug: string
  type: ProductType.oneTime
  giftCard: boolean           // The product is a gift card (only one product can be a gift card)
  options: ProductOption[]    // Product options available for selection (only one-time products have options)
  giftCardExpiration: number | null
  variants: ProductVariant[]  // Only one-time products can have product variants
}

type ProductSubscription = {
  bundle: Bundle | null
  bundleId: Bundle['id'] | null
  bundleRulesetId: BundleRuleset['id'] | null
  collectShippingAddress: boolean
  createdAt: string
  deliveryInfo: string | null
  description: string | null
  digital: boolean            // Digital vs physical product
  giftingEnabled: boolean     // Determines if the product can be purchased as a gift
  id: ID
  images: ProductImage[]
  name: string
  slug: string
  type: ProductType.subscription
  setupFee: number            // The setup fee is applicable only for subscription products
  preOrderEndAt: string | null // Customer won't be charged until that date
  plans: ProductPlan[]        // Only subscription products can have product plans
  pricings: ProductPlan[]     // Deprecated, use plans instead
}

type Product = ProductPlan | ProductVariant
type ParentProduct = ProductSubscription | ProductOneTime

type ProductRequestHeaders = {
  'x-currency'?: string
  [key: string]: string | undefined
}

type ProductsResourceParams = {
  expand?: string[]
}

type ProductsListParams = {
  page?: number
  perPage?: number
  tags?: string[]             // Filter by tag names
  type?: ParentProduct['type'] // Filter by product type
  slugs?: ParentProduct['slug'][]
  digital?: boolean
  giftCard?: boolean
}

type ProductsListResponse = {
  data: ParentProduct[]
  pagination: Pagination
}
```

## Bundles

```typescript
// Bundle selection type
// - variant: select from a list of product variants
// - product: list is grouped by product and you can select multiple product variants from the same bundle group
// - single_product: list is grouped by a product and you can select only one product variant from the bundle group
type BundleSelectionType = 'variant' | 'product' | 'single_product'

// Bundle discount type - defines how discounts are applied to bundles
type BundleDiscountType = 'per_item' | 'total' | 'percentage'

// Bundle price type - defines how the bundle price is calculated
type BundlePriceType = 'per_item' | 'total'

type BundleAppearanceType = 'one_step' | 'two_step' | 'without_ruleset' | 'after_checkout'
type BundleRulesetType = 'total' | 'quantity'
type BundleQuantitySelector = number

type BundleDiscountRange = {
  amountOff: number | null
  percentOff: number | null
  range: number
}

type BundleDiscount = {
  id: ID
  rulesetId: ID
  planId: ID
  createdAt: string
  updatedAt: string
  ranges: BundleDiscountRange[]
}

type AttributeValue = {
  id: ID
  name: string
}

type BundleFilter = {
  id: ID
  name: string
  attributeId: ID
  values: AttributeValue[]
  createdAt: string
  updatedAt: string
}

type BundlePreference = {
  id: ID
  title: string
  attributeId: ID
  values: AttributeValue[]
  createdAt: string
  updatedAt: string
}

type BundleRuleset = {
  id: ID
  name: string
  minQuantity: number
  maxQuantity: number
  minTotal: number
  maxTotal: number
  createdAt: string
  updatedAt: string
  products: ParentProduct[]
  ctaText: string | null
}

type BundlePlan = {
  createdAt: string
  discounts: BundleDiscount[]
  id: ID
  prices: BundlePrice[]
  plan: ProductPlan | null
  updatedAt: string
  variant: ProductVariant | null
  pricing: ProductPlan | null
}

type BundlePriceRange = {
  amount: number | null
  range: number
}

type BundlePrice = {
  createdAt: string
  id: ID
  planId: BundlePlan['id']
  ranges: BundlePriceRange[]
  rulesetId: BundleRuleset['id']
}

type Bundle = {
  appearanceType: BundleAppearanceType
  configurable: boolean       // If true, the customer can modify his selection
  createdAt: string
  deliveryInfo: string | null
  description: string | null
  digital: boolean
  discounts: BundleDiscount[]
  discountType: BundleDiscountType | null  // Null means no discount
  filters: BundleFilter[]
  hiddenItems: boolean
  id: ID
  images: ProductImage[]
  name: string
  plans: BundlePlan[]
  preferences: BundlePreference[]
  prices: BundlePrice[]
  priceType: BundlePriceType | null  // Null means price is calculated by the sum of bundle items
  quantitySelectors: BundleQuantitySelector[] | null
  rulesets: BundleRuleset[]
  rulesetType: BundleRulesetType
  searchable: boolean
  selectionType: BundleSelectionType
  showRulesetName: boolean
  slug: string
  updatedAt: string
}

type BundleItemSettings = {
  id: ID
  rulesetId: ID
  maxQuantity: number
  createdAt: string
  updatedAt: string
}

type BundleItem = {
  id: ID
  productId: ProductVariant['id']
  product: ProductVariant
  settings: BundleItemSettings[]
  quantity: number
  extraPrice: number
  position: number
  createdAt: string
  updatedAt: string
  stockCount: number | null
}

type BundleGroup = {
  id: ID
  createdAt: string
  updatedAt: string
  items: BundleItem[]
  maxQuantity: number
  minQuantity: number
  productId: ProductOneTime['id']
  product: ProductOneTime
}

type BundleQuoteItem = {
  productId: ID
  product: ProductVariant
  quantity: number
  price: number
  total: number
  subTotal: number
  taxAmount: number
  taxRate: number
  taxInclusive: boolean
  discount: boolean
}

type BundleQuote = {
  productId: ID
  product: Product
  quantity: number
  price: number
  total: number
  subTotal: number
  taxAmount: number
  taxRate: number
  taxInclusive: number
  discount: number
  items: BundleQuoteItem[]
}

type BundleRequestHeaders = {
  'x-currency'?: string  
  [key: string]: string | undefined
}

type BundleHeaders = BundleRequestHeaders 

type BundleResourceParams = {
  expand?: string[]
}

type BundleGroupsParams = {
  page?: number
  perPage?: number
  expand?: string[]
}

type BundleGroupsResponse = {
  data: BundleGroup[]
  pagination: Pagination
}

type BundleListParams = {
  page?: number
  perPage?: number
  tags?: string[]
  slugs?: string[]
  ids?: Bundle['id'][]
  digital?: boolean
  configurable?: boolean
}

type BundleListResponse = {
  data: Bundle[]
  pagination: Pagination
}

type BundlePayloadItem = {
  productId: ID
  quantity: number
}

type BundlePayloadPreference = {
  attributeId: ID
  values: ID[]
}

type BundleQuotePayload = {
  productId: ID
  quantity: number
  items: BundlePayloadItem[]
  preferences: BundlePayloadPreference[]
}
```

## Cart

```typescript
type GiftCardRecipient = {
  customerEmail: string | null
  customerName: string | null
  message: string | null
}

type SurveyOptionAnswerText = {
  content: string
}

type SurveyOptionAnswerEmail = {
  content: string
}

type SurveyOptionAnswerPlan = {
  id: ID
}

type SurveyOptionAnswerOffer = {
  id: ID
}

type SurveyOptionAnswerSelect = {
  id: ID
}

type SurveyOptionAnswerMultiple = {
  id: ID
}

type SurveyOptionAnswerQuantity = {
  id: ID
  quantity: number
}

type SubscriptionSurveyOptionAnswer = SurveyOptionAnswerText | SurveyOptionAnswerSelect | SurveyOptionAnswerMultiple | SurveyOptionAnswerQuantity | SurveyOptionAnswerOffer | SurveyOptionAnswerPlan | SurveyOptionAnswerEmail

type SubscriptionSurveyOption = {
  answers: SubscriptionSurveyOptionAnswer[]
  questionId: ID
}

type CartItemAddPayloadSubscription = {
  productId: number           // ID of the plan to add
  quantity?: number
  options?: SubscriptionSurveyOption[] | null
}

type CartItemAddPayloadOneTime = {
  productId: number           // ID of the variant to add
  quantity?: number
  addon?: boolean             // Add as an addon to the subscription
  addonDuration?: number | 0 | 1  // Duration of the addon. 0 = forever, 1 = 1 shipment
  giftCard?: GiftCardRecipient | null  // For gift card products
}

type CartItemAddPayloadBundle = {
  productId: number
  quantity?: number
  options?: SubscriptionSurveyOption[] | null
  bundle?: {
    items: BundlePayloadItem[]
    preferences: BundlePayloadPreference[]
  }
}

export type CartItemAddPayloadSurvey = {
  surveyId: number
}

export type CartItemAddPayloadBundleConfigure = {
  productId?: number
  bundleId: number
  quantity?: number
  options?: SubscriptionSurveyOption[] | null
}

export type ConfigureItemPayload =
  | CartItemAddPayloadSubscription
  | CartItemAddPayloadOneTime
  | CartItemAddPayloadBundle
  | CartItemAddPayloadBundleConfigure
  | CartItemAddPayloadSurvey

type CartUpdatePayload = {
  referralId?: ID | null
  currencyCode?: string
  couponCode?: string | null
  giftCardCode?: string | null
  giftInfo?: {
    startsAt: string | null          // Only for subscription/bundle plans
    numberOfOrders: number | null    // Only for subscription/bundle plans  
    message: string | null
    recipientEmail?: string | null
  } | null
}

type CartCreatePayload = {
  referralId?: ID | null
  currencyCode?: string
  couponCode?: string | null
  giftCardCode?: string | null
}
```

## Lead

```typescript
type LeadSubscribePayload = {
  email: string
  firstName?: string | null
  lastName?: string | null
  metadata?: Record<string, string> | null
}

type LeadSubscribeResponse = {
  email: string
  firstName: string | null
  id: ID
  ipAddress: string
  lastName: string | null
  userAgent: string
  metadata?: Record<string, string> | null
}
```

## Surveys

```typescript
enum SurveyQuestionType {
  text = 'text',
  select = 'select',
  multiple = 'multiple',
  quantity = 'quantity',
  offer = 'offer',
  plan = 'plan',
  email = 'email'
}

enum SurveyAppearanceType {
  beforeCart = 'before_cart',
  afterCheckout = 'after_checkout',
  subscriptionBox = 'subscription_box'
}

type SurveyProgressType = 'steps' | 'dots' | 'bar' | 'hidden'

type SurveyAnswerSelect = {
  content: string | null
  createdAt: string
  customizations: Record<string, unknown> | null
  default: boolean
  description: string | null
  id: ID
  imageUrl: string | null
  position: number
  price: number
  stockCount: number | null
  updatedAt: string
}

type SurveyAnswerMultiple = {
  content: string | null
  createdAt: string
  customizations: Record<string, unknown> | null
  default: boolean
  description: string | null
  id: ID
  imageUrl: string | null
  position: number
  price: number
  stockCount: number | null
  updatedAt: string
}

type SurveyAnswerQuantity = {
  content: string | null
  createdAt: string
  customizations: Record<string, unknown> | null
  defaultQuantity: number
  description: string | null
  id: ID
  imageUrl: string | null
  position: number
  price: number
  stockCount: number | null
  updatedAt: string
}

type SurveyAnswerPlan = {
  content: string | null
  createdAt: string
  customizations: Record<string, unknown> | null
  default: boolean
  description: string | null
  id: ID
  imageUrl: string | null
  position: number
  price: number
  productId: ProductVariant['id'] | null
  product: Product | null
  updatedAt: string
}

type SurveyAnswerOffer = {
  content: string | null
  createdAt: string
  customizations: Record<string, unknown> | null
  description: string | null
  id: ID
  imageUrl: string | null
  position: number
  price: number
  productId: ProductVariant['id'] | null
  product: Product | null
  updatedAt: string
}

type SurveyAnswer = SurveyAnswerSelect | SurveyAnswerMultiple | SurveyAnswerQuantity | SurveyAnswerPlan | SurveyAnswerOffer

type SurveyQuestionEmail = {
  answers: never[]
  createdAt: string
  description: string | null
  id: ID
  position: number
  required: boolean
  title: string
  updatedAt: string
  customizations: Record<string, unknown> | null
  type: SurveyQuestionType.email
}

type SurveyQuestionText = {
  answers: never[]
  createdAt: string
  description: string | null
  id: ID
  position: number
  required: boolean
  title: string
  updatedAt: string
  customizations: Record<string, unknown> | null
  type: SurveyQuestionType.text
}

type SurveyQuestionSelect = {
  answers: SurveyAnswerSelect[]
  createdAt: string
  customizations: Record<string, unknown> | null
  description: string | null
  id: ID
  position: number
  required: boolean
  title: string
  type: SurveyQuestionType.select
  updatedAt: string
}

type SurveyQuestionMultiple = {
  answers: SurveyAnswerMultiple[]
  createdAt: string
  customizations: Record<string, unknown> | null
  description: string | null
  id: ID
  maxAmount: number | null
  maxCount: number | null
  minAmount: number | null
  minCount: number | null
  position: number
  required: boolean
  title: string
  type: SurveyQuestionType.multiple
  updatedAt: string
}

type SurveyQuestionQuantity = {
  answers: SurveyAnswerQuantity[]
  createdAt: string
  customizations: Record<string, unknown> | null
  description: string | null
  id: ID
  maxAmount: number | null
  maxCount: number | null
  minAmount: number | null
  minCount: number | null
  position: number
  required: boolean
  title: string
  type: SurveyQuestionType.quantity
  updatedAt: string
}

type SurveyQuestionOffer = {
  answers: SurveyAnswerOffer[]
  createdAt: string
  customizations: Record<string, unknown> | null
  description: string | null
  id: ID
  required: boolean
  position: number
  title: string
  type: SurveyQuestionType.offer
  updatedAt: string
}

type SurveyQuestionPlan = {
  answers: SurveyAnswerPlan[]
  createdAt: string
  description: string | null
  id: ID
  position: number
  title: string
  required: boolean
  type: SurveyQuestionType.plan
  customizations: Record<string, unknown> | null
  updatedAt: string
}

type SurveyQuestion = SurveyQuestionOffer | SurveyQuestionQuantity | SurveyQuestionMultiple | SurveyQuestionSelect | SurveyQuestionText | SurveyQuestionEmail | SurveyQuestionPlan

type Survey = {
  appearanceType: SurveyAppearanceType
  id: number
  title: string
  questions: SurveyQuestion[]
  multiplyPriceByShipmentNumber: boolean
  customizations: Record<string, unknown> | null
}
```

### Component Usage Guidelines

1. **ProductInfoSection**: Displays product name, description, and product form (variants, plans, quantity selector)
   - **Required for**: Product detail pages
   - **Props**: `product: Product`
   - **Customization**: You can style the container and typography, but the component logic must remain intact

2. **ProductGallerySection**: Displays product images in a carousel with thumbnails
   - **Required for**: Product and bundle detail pages
   - **Props**: `images: ProductImage[]`, `productName: string`
   - **Customization**: You can style the gallery appearance, but the carousel functionality must remain intact

3. **BundleInfoSection**: Displays bundle name, description, and bundle form
   - **Required for**: Bundle detail pages
   - **Props**: `bundle: Bundle`, `groups: BundleGroup[]`
   - **Customization**: You can style the container and typography, but the component logic must remain intact

4. **AddToCartButton**: Handles adding products or bundles to the cart
   - **Required for**: Any page with add-to-cart functionality
   - **Props**: `payload: ConfigureItemPayload`
   - **Customization**: You can style the button appearance and provide custom children, but the cart logic must remain intact

## Currency Support

Subbly supports multi-currency functionality through request headers. This allows you to display prices in different currencies based on user preferences.

```typescript
import { useCurrencyFormatter } from '@subbly/react'

// in your react code
const { formatAmount } = useCurrencyFormatter()

const productPrice = formatAmount(product.price)
```

### Currency Headers

All Subbly fetch functions accept an optional headers parameter that can include currency information:

```typescript
// Example of using currency headers with product functions
const headers = { 'x-currency': 'USD' };

// Use headers with any Subbly fetch function
const products = await subblyApi.product.list(params, headers);
const product = await subblyApi.product.bySlug(slug, headers);
const bundle = await subblyApi.bundle.byId(id, headers);
```

The currency header will affect all price-related fields in the response, including:

- Product prices
- Variant prices
- Plan prices
- Bundle prices
- Price schemas and ranges

This allows you to display consistent pricing in the user's preferred currency throughout your application.
