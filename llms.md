# Subbly E-commerce Integration

This document explains how to integrate with the Subbly platform to retrieve product information and manage the shopping cart in your Next.js application.

## General Information

- By default you are using `addToCart` method from a `useSubblyCart`, but users sometimes can ask to add a direct link to check. In that case use buyLink from an appropriate object (productVariant, productPlan, product)
- All prices are defined in integers(cents), not decimals.
- When creating cart icon or cart counter, use these CSS classes to connect them with Subbly cart: `subbly-cart-product-count`, `subbly-cart`.
- These classes will automatically toggle cart widget and update cart counter when items are added or removed from the cart.
- If you see that in the existing code the cart icon or cart counter is not working, check if these classes are used and propose to add them.
- In VERY RARE CASES, you can update these classes inside `src/lib/subbly/subbly-script.tsx` file with the `cartToggleEl` and `cartCountEl` properties.

## Product Integration

This section explains how to integrate with the Subbly platform to retrieve product information. These functions allow you to fetch products and product variants with proper typing for server-side operations.

### Product API Quick Reference

```typescript
// Get a paginated list of products with filtering options
listProducts(params: ListProductsFilters, headers?: ProductHeaders): Promise<ProductList>

// Get a paginated list of bundles with filtering options
listBundles(params: ListBundlesFilters, headers?: BundleHeaders): Promise<BundleList>

// Get a single product by its numeric ID
productById(id: number, headers?: ProductHeaders): Promise<Product>

// Get a product by its URL-friendly slug (returns null if not found)
productBySlug(slug: string, headers?: ProductHeaders): Promise<Product | null>

// Get a single bundle by its numeric ID
bundleById(id: number, headers?: BundleHeaders): Promise<Bundle>

// Get a bundle by its URL-friendly slug (returns null if not found)
bundleBySlug(slug: string, headers?: BundleHeaders): Promise<Bundle | null>

// Get a product variant or subscription product plan by its numeric ID
variantOrPlanById(id: number, headers?: ProductHeaders): Promise<ProductVariant | ProductPlan>

// Get bundle groups for a specific bundle
loadBundleGroups(bundleId: number, headers?: BundleHeaders): Promise<BundleGroupList>
```

## Cart Integration

This section explains how to use the Subbly cart integration hook to add products to the cart in your Next.js application.

### Cart API Quick Reference

```typescript
// Import the hook
import { useSubblyCart } from '@/lib/subbly/use-subbly-cart';

// Use the hook in your component
const { addToCart, updateCart } = useSubblyCart();

// Add a product to the cart
addToCart({
  productId: 123,
  quantity: 1
});

// Update cart information
updateCart({
  couponCode: 'SAVE20'
});
```

## Core Types

### Product Types

```typescript
// Basic entity types with minimal properties
type ProductImage = {
  id: number;             // Unique identifier
  url: string;            // Access URL
  order: number;          // Display position
}

type Attribute = {
  id: number;             // Unique identifier
  name: string;           // Name (e.g., "Color", "Size")
  value: string;          // Value (e.g., "Red", "Large")
}

type Option = {
  id: number;             // Unique identifier
  name: string;           // Option name
  value: string;          // Option value
}

// Pricing related types
type PriceRange = {
  range: number;          // Quantity threshold
  amount: number;         // Price at this quantity
}

type PriceSchema = {
  id: number;             // Unique identifier
  type: 'flat_price' | 'volume_price';  // Pricing model
  amount: number;         // Base price
  ranges: PriceRange[];   // Volume pricing (if applicable)
}

// Pagination for list responses
type Pagination = {
  currentPage: number;    // Current page number
  from: number;           // Starting index of items on current page
  lastPage: number;       // Total number of pages
  to: number;             // Ending index of items on current page
  total: number;          // Total items across all pages
}

// Subscription plan details
type ProductPlan = {
  id: number;
  type: 'plan';            // Identifies this as a product plan
  name: string | null;
  description: string | null;
  billingInterval: { count: number; unit: 'day' | 'week' | 'month' };
  trial: {
    length: number | null;
    price: number | null;
  };
  price: number;
  priceSchema: PriceSchema;
  stockCount: number | null;
  attributes: Attribute[];
  buyLink: string;
  shippings: Array<{
    // How much day from a purchase will take to send each shipping
    buffer: {
      // Unit of time to wait till the shipping is sent
      unit: 'day' | 'week' | 'month' | null;
      // How many units of time wait till the shipping is sent
      count: number | null;
    },
    // On which day of billing interval the shipping will be sent
    unit: {
      // Day of a week/month
      day: number | null;
      // Number of the billing cycle month/week. Starting from 0
      offset: number | null;
    }
  }>;
  billingCycleName: string;
  shippingCycleName: string | null;
  // The number of times the product plan will be charged during subscription lifecycle.
  // After this number of charges, the subscription will be expired.
  limitCharges: number | null;  // null = unlimited
  survey: Survey | null;
}

// Product variant
type ProductVariant = {
  id: number;
  type: 'variant';         // Identifies this as a product variant
  name: string;
  description: string | null;
  price: number;
  priceSchema: PriceSchema;
  stockCount: number | null;  // null = unlimited
  attributes: Attribute[];
  options: Option[];
  buyLink: string;
}

// Product combination information
type ProductCombination = {
  id: number;             // Variant ID
  inStock: boolean;       // Whether the combination is in stock
  price: number;          // Price of this specific combination
  [key: string]: string | boolean | number;  // Additional properties for option values
}

// Product type
type ProductType = 'one_time' | 'subscription';

// Complete product information
type Product = {
  id: number;
  type: ProductType;
  name: string;
  slug: string;
  description: string | null;
  priceFrom: number;
  images: ProductImage[];
  // Only one-time product can have product variants
  variants: ProductVariant[];
  // Only subscription product can have product plans
  plans: ProductPlan[];
  // Product options available for selection.
  // Only one-time products have options.
  options: ProductOption[];
  // Determines if the product can be purchased as a gift
  giftingEnabled: boolean;
  digital: boolean;       // Digital vs physical
  // The product is a gift card.
  // This is used to determine if the product is a gift card or not.
  // Only one product can be a gift card.
  giftCard: boolean;
  // The setup fee is applicable only for subscription products
  setupFee: number | null;
  // Pre-order end date is applicable only for subscription products.
  // Customer won't be charged until that date.
  preOrderEndAt: Date | null;
  // Array of option combinations with their availability and price information
  // Only applicable for one-time products with variants
  combinations?: ProductCombination[];
}

// Product option definition
type ProductOption = {
  id: number;             // Unique identifier
  name: string;           // Option name (e.g., "Color", "Size")
  values: string[];       // Available values for this option
}

// Filter parameters for product listing
type ListProductsFilters = {
  page?: number;
  perPage?: number;   // Filter by tag IDs
  tags?: string[];    // Filter by tag names
  type?: ProductType;   // Filter by product type
  slugs?: string[];
  digital?: 0 | 1;
  giftCard?: 0 | 1;
  currency?: string;
}

// Product list response
type ProductList = {
  data: Product[];
  pagination: Pagination;
}
```

### Survey Types

```typescript
type Survey = {
  id: number;
  title: string;
  questions: SurveyQuestion[];
}

enum SurveyQuestionType {
  text = "text",
  select = "select",
  multiple = "multiple",
  quantity = "quantity"
}

type SurveyQuestionBase = {
  id: number;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
}

type SurveyAnswerSelect = {
  id: number;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stockCount: number | null;
  default: boolean;
  position: number;
}

type SurveyAnswerMultiple = {
  id: number;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stockCount: number | null;
  default: boolean;
  position: number;
}

type SurveyAnswerQuantity = {
  id: number;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stockCount: number | null;
  defaultQuantity: number;
  position: number;
}

type SurveyCountLimits = {
  min: number | null;
  max: number | null;
}

type SurveyAmountLimits = {
  min: number | null;
  max: number | null;
}

type SurveyLimits = {
  count: SurveyCountLimits;
  amount: SurveyAmountLimits;
}

type SurveyQuestionText = SurveyQuestionBase & {
  type: SurveyQuestionType.text;
}

type SurveyQuestionSelect = SurveyQuestionBase & {
  type: SurveyQuestionType.select;
  answers: SurveyAnswerSelect[];
}

type SurveyQuestionMultiple = SurveyQuestionBase & {
  type: SurveyQuestionType.multiple;
  answers: SurveyAnswerMultiple[];
  limits: SurveyLimits;
}

type SurveyQuestionQuantity = SurveyQuestionBase & {
  type: SurveyQuestionType.quantity;
  answers: SurveyAnswerQuantity[];
  limits: SurveyLimits;
}

type SurveyQuestion = 
  | SurveyQuestionText
  | SurveyQuestionSelect
  | SurveyQuestionMultiple
  | SurveyQuestionQuantity
```

### Bundle Types

```typescript
// Bundle selection type
// - variant: select from a list of product variants
// - product: list is grouped by product and you can select multiple product variants from the same bundle group
// - single_product: list is grouped by a product and you can select only one product variant from the bundle group
type BundleSelectionType = 'variant' | 'product' | 'single_product';

// Bundle discount type - defines how discounts are applied to bundles
// Null means no discount
type BundleDiscountType = 'per_item' | 'total' | 'percentage' | null;

// Bundle price type - defines how the bundle price is calculated
// Null means price is calculated by the sum of bundle items
type BundlePriceType = 'per_item' | 'total' | null;

// Bundle price range - defines a price range for bundle pricing
type BundlePriceRange = {
  amount: number | null;
  range: number;
};

// Bundle price - defines bundle price information
type BundlePrice = {
  id: number;
  planId: number;
  rulesetId: number;
  ranges: BundlePriceRange[];
};

// Bundle discount range - defines a discount range for bundle discounts
type BundleDiscountRange = {
  amountOff: number | null;
  percentOff: number | null;
  range: number;
};

// Bundle discount - defines bundle discount information
type BundleDiscount = {
  id: number;
  rulesetId: number;
  planId: number;
  ranges: BundleDiscountRange[];
};

// Bundle plan type
type BundlePlan = {
  id: number;
  type: 'one_time' | 'subscription';
  plan: ProductVariant | ProductPlan;
  prices: BundlePrice[];
  discounts: BundleDiscount[];
}

// Bundle type
type Bundle = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  priceFrom: number;
  images: ProductImage[];
  plans: BundlePlan[];
  digital: boolean;
  // If true, the customer can select the product variants in the bundle
  configurable: boolean;
  selectionType: BundleSelectionType;
  discountType: BundleDiscountType;
  priceType: BundlePriceType;
}

// Filter parameters for bundle listing
type ListBundlesFilters = {
  page?: number;
  perPage?: number;
  tags?: string[];
  slugs?: string[];
  ids?: number[];
  digital?: 0 | 1;
  configurable?: 0 | 1;
  currency?: string;
}

// Bundle list response
type BundleList = {
  data: Bundle[];
  pagination: Pagination;
}

// Bundle item - represents a product variant
type BundleItem = {
  id: number;
  varianId: number;
  variant: ProductVariant;
  quantity: number;
  extraPrice: number;
  stockCount: number | null;
}

// Bundle group - represents a group of product variants in a bundle
type BundleGroup = {
  id: number;
  items: BundleItem[];
  maxQuantity: number;
  minQuantity: number;
  productId: number;
  product: Product;
}

// Bundle group list response
type BundleGroupList = {
  data: BundleGroup[];
  pagination: Pagination;
}

// Request headers for API calls
type RequestHeaders = {
  [key: string]: string
}

// Headers for bundle-related API calls
type BundleHeaders = RequestHeaders & {
  'x-currency'?: string  // Optional currency code for pricing
}

// Headers for product-related API calls
type ProductHeaders = RequestHeaders & {
  'x-currency'?: string  // Optional currency code for pricing
}
```

### Cart Types

```typescript
type GiftCardRecipient = {
  customerEmail: string | null
  customerName: string | null
  message: string | null
}

type SurveyAnswer = {
  id?: number              // required for select, multiple, quantity question types
  content?: string         // required for text question type
  quantity?: number        // required for quantity question type
}

type SurveyOption = {
  questionId: number
  answers: SurveyAnswer[]
}

type CartItemAddPayloadSubscription = {
  productId: number               // ID of the plan to add
  quantity?: number
  options?: SurveyOption[]
}
  
type CartItemAddPayloadOneTime = {
  productId: number               // ID of the variant to add
  quantity?: number
  addon?: boolean                 // Add as an addon to the subscription
  addonDuration?: number | 0 | 1  // Duration of the addon. 0 = forever, 1 = 1 shipment
  giftCard?: GiftCardRecipient | null  // For gift card products
}

type CartItemAddPayloadBundle = {
  productId: number
  quantity?: number
  bundle?: {
    items: BundlePayloadItem[]
    preferences: []
  }
  options?: SurveyOption[]
}

type CartItemAddPayloadBundleConfigure = {
  productId?: number
  bundleId: number
  quantity?: number
  options?: SurveyOption[]
}

type CartItemAddPayloadSurvey = {
  surveyId: number
}

type ConfigureItemPayload =
  | CartItemAddPayloadSubscription
  | CartItemAddPayloadOneTime
  | CartItemAddPayloadBundle
  | CartItemAddPayloadBundleConfigure
  | CartItemAddPayloadSurvey

type UpdateCartPayload = {
  couponCode?: string
  currencyCode?: string
  giftCardCode?: string
  giftInfo?: {
    message: string | null
    numberOfOrders: number | null    // Only for subscription/bundle plans
    recipientEmail?: string | null
    startsAt: string | null          // Only for subscription/bundle plans
  } | null
  referralId?: number | null
}
```

## Available Functions

### Product Functions

#### List Products

Fetches a paginated list of products with optional filtering parameters.

```typescript
// Get a list of products with pagination and filtering
async function listProducts(params: ListProductsFilters, headers?: ProductHeaders): Promise<ProductList>
```

#### List Bundles

Fetches a paginated list of bundles with optional filtering parameters.

```typescript
// Get a list of bundles with pagination and filtering
async function listBundles(params: ListBundlesFilters, headers?: BundleHeaders): Promise<BundleList>
```

#### Get Product by ID

Retrieves a specific product by its unique ID.

```typescript
// Get a product by its numeric ID
async function productById(id: number, headers?: ProductHeaders): Promise<Product>
```

#### Get Product by Slug

Retrieves a product using its URL-friendly slug identifier.

```typescript
// Get a product by its slug (URL-friendly identifier)
async function productBySlug(slug: string, headers?: ProductHeaders): Promise<Product | null>
```

#### Get ProductVariant or ProductPlan by ID

Retrieves a specific ProductVariant or ProductPlan by its unique ID.

```typescript
// Get a product variant or product plan by its numeric ID
async function variantOrPlanById(id: number, headers?: ProductHeaders): Promise<ProductVariant | ProductPlan>
```

#### Get Bundle by ID

Retrieves a specific bundle by its unique ID.

```typescript
// Get a bundle by its numeric ID
async function bundleById(id: number, headers?: BundleHeaders): Promise<Bundle>
```

#### Get Bundle by Slug

Retrieves a bundle using its URL-friendly slug identifier.

```typescript
// Get a bundle by its slug (URL-friendly identifier)
async function bundleBySlug(slug: string, headers?: BundleHeaders): Promise<Bundle | null>
```

#### Load Bundle Groups for Configuration

Retrieves bundle groups for a specific bundle. This is particularly useful for bundles with `BundleSelectionType` eq `single_product`

```typescript
// Get bundle groups for a specific bundle
async function loadBundleGroups(bundleId: number, headers?: BundleHeaders): Promise<BundleGroupList>
```

### Cart Functions

#### addToCart

Adds an item to the Subbly cart.

```typescript
async function addToCart(payload: ConfigureItemPayload): Promise<void>
```

Examples:

```typescript
// Add a subscription product
await addToCart({ productId: 123, quantity: 1 });

// Add a subscription product with survey options
await addToCart({ 
  productId: 123, 
  quantity: 1,
  options: [{
    questionId: 1,
    answers: [{ id: 5 }]
  }]
});

// Add a one-time product as an addon
await addToCart({ productId: 456, addon: true, addonDuration: 0 });

// Add a bundle
await addToCart({ productId: 789, bundleId: 101, quantity: 2 });

// Add a survey
await addToCart({ surveyId: 101 });
```

#### updateCart

Updates the cart with new information.

```typescript
async function updateCart(payload: UpdateCartPayload): Promise<void>
```

Examples:

```typescript
// Apply a coupon code
await updateCart({ couponCode: 'SAVE20' });

// Change currency
await updateCart({ currencyCode: 'EUR' });

// Apply a gift card
await updateCart({ giftCardCode: 'ba445a44-e446-47da-b496-97d569f59ff5' });

// Set gift information for a subscription
await updateCart({ 
  giftInfo: {
    message: 'Happy Birthday!',
    numberOfOrders: 3,          // Only for subscription/bundle plans
    recipientEmail: 'friend@example.com',
    startsAt: '2024-02-01'      // Only for subscription/bundle plans
  }
});

// Set a referral ID
await updateCart({ referralId: 555 });

// Update multiple cart properties at once
await updateCart({
  couponCode: 'SAVE20',
  currencyCode: 'EUR',
  referralId: 555
});
```

## Next.js Integration Examples

### Product Integration Examples

#### Pagination example

Here's how to use these functions in Next.js server components:

```typescript
// app/products/page.tsx
import { listProducts } from '@/lib/subbly/fetch/list-products';

export default async function ProductsPage() {
  // Fetch products on the server
  const productList = await listProducts({
    page: 1,
    perPage: 20,
    type: 'one_time',
    digital: 0,
    giftCard: 0
  });
  
  // Access the data and pagination info
  const { data, pagination } = productList;
  
  // Now you can use this data to render your component
  // ...
}
```

#### Fetch product by slug

Using product slug for dynamic routes:

```typescript
// app/products/[slug]/page.tsx
import { productBySlug } from '@/lib/subbly/fetch/product-by-slug';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // Fetch product by slug
  const product = await productBySlug(params.slug);
  
  // If product not found, show 404 page
  if (!product) {
    notFound();
  }
  
  // Access product data
  const { id, name, description, images, variants, plans } = product;
  
  // Now you can use this data to render your component
  // ...
}
```

#### ProductVariant Or ProductPlan Page

Fetching ProductVariant or ProductPlan details in a server component:

```typescript
// app/product-items/[id]/page.tsx
import { variantOrPlanById } from '@/lib/subbly/fetch/variant-or-plan-by-id';
import { notFound } from 'next/navigation';

export default async function ProductItemPage({ params }: { params: { id: string } }) {
  try {
    // Fetch product item data
    const productItem = await variantOrPlanById(parseInt(params.id));
    
    // Access product item properties
    const { name, description, price, attributes, options } = productItem;
    
    // Now you can use this data to render your component
    // ...
  } catch (error) {
    notFound();
  }
}
```

#### Distinguishing Between ProductVariants and ProductPlans

When working with the `variantOrPlanById` function, you can use the `type` property to determine whether you're dealing with a ProductVariant or a ProductPlan and render the appropriate template:

```typescript
// app/variants-or-plans/[id]/page.tsx
import { variantOrPlanById } from '@/lib/subbly/fetch/variant-or-plan-by-id';
import { notFound } from 'next/navigation';

export default async function ProductItemPage({ params }: { params: { id: string } }) {
  try {
    // Fetch the item (could be either a ProductVariant or a ProductPlan)
    const item = await variantOrPlanById(parseInt(params.id));
    
    // Check the type to determine how to handle it
    if (item.type === 'variant') {
      // This is a one-time product variant      
    } else if (item.type === 'plan') {
      // This is a subscription product plan
    }
    
    // Common rendering logic for both types    
  } catch (error) {
    notFound();
  }
}
```

#### Listing Bundles

```typescript
// app/bundles/page.tsx
import { listBundles } from '@/lib/subbly/fetch/list-bundles';

export default async function BundlesPage() {
  // Fetch bundles on the server
  const bundleList = await listBundles({
    page: 1,
    perPage: 20,
    digital: 0,       // Only physical bundles
  });
  
  // Access the data and pagination info
  const { data, pagination } = bundleList;
  
  // Now you can use this data to render your component
  // ...
}
```

#### Fetch Bundle by ID

Fetching a specific bundle by its ID:

```typescript
// app/bundles/[id]/page.tsx
import { bundleById } from '@/lib/subbly/fetch/bundle-by-id';
import { notFound } from 'next/navigation';

export default async function BundlePage({ params }: { params: { id: string } }) {
  try {
    // Fetch bundle by ID
    const bundle = await bundleById(parseInt(params.id));
    
    // Access bundle data
    const { name, description, images, plans, priceFrom } = bundle;
    
    // Now you can use this data to render your component
    // ...
  } catch (error) {
    notFound();
  }
}
```

#### Fetch Bundle by Slug

Using bundle slug for dynamic routes:

```typescript
// app/bundles/[slug]/page.tsx
import { bundleBySlug } from '@/lib/subbly/fetch/bundle-by-slug';
import { notFound } from 'next/navigation';

export default async function BundlePage({ params }: { params: { slug: string } }) {
  // Fetch bundle by slug
  const bundle = await bundleBySlug(params.slug);
  
  // If bundle not found, show 404 page
  if (!bundle) {
    notFound();
  }
  
  // Access bundle data
  const { id, name, description, images, plans, priceFrom } = bundle;
  
  // Now you can use this data to render your component
  // ...
}
```

#### Load Bundle Groups

Fetching bundle groups for a configurable bundle:

```typescript
// app/bundles/[id]/configure/page.tsx
import { bundleById } from '@/lib/subbly/fetch/bundle-by-id';
import { loadBundleGroups } from '@/lib/subbly/fetch/load-bundle-groups';
import { notFound } from 'next/navigation';

export default async function BundleConfigurePage({ params }: { params: { id: string } }) {
  try {
    // Fetch bundle by ID
    const bundle = await bundleById(parseInt(params.id));
    
    let groups: BundleGroup[] = []
  
    if (bundle.selectionType === 'single_product') {
      groups = (await loadBundleGroups(bundle.id)).data
    }
  } catch (error) {
    notFound();
  }
}
```

### Cart Integration Examples

#### Basic Usage

```typescript
'use client';

import { useSubblyCart } from '@/lib/subbly/use-subbly-cart';
import { Button } from '@/components/ui/button';

export default function AddToCartButton({ productId }) {
  const { addToCart, updateCart } = useSubblyCart();
  
  const handleAddToCart = async () => {
    await addToCart({ productId });
  };
  
  return (
    <Button onClick={handleAddToCart}>
      Add to Cart
    </Button>
  );
}
```

#### Adding Products with Survey Options

```typescript
'use client';

import { useSubblyCart } from '@/lib/subbly/use-subbly-cart';
import { Button } from '@/components/ui/button';
import { SurveyOption } from '@/lib/subbly/types';

export default function AddProductWithSurvey({ productId, surveyOptions }: {
  productId: number;
  surveyOptions: SurveyOption[];
}) {
  const { addToCart } = useSubblyCart();
  
  const handleAddToCart = async () => {
    await addToCart({
      productId,
      quantity: 1,
      options: surveyOptions
    });
  };
  
  return (
    <Button onClick={handleAddToCart}>
      Add to Cart
    </Button>
  );
}

const surveyOptions: SurveyOption[] = [
  {
    questionId: 1,
    answers: [{ id: 5 }, { id: 6}]  // Multiple
  },
  {
    questionId: 2,
    answers: [{ content: 'Custom text response' }]  // Text answer
  },
  {
    questionId: 3,
    answers: [
      { id: 10, quantity: 2 },
      { id: 11, quantity: 1 }
    ]
  }
];
```

#### Adding a Bundle

```typescript
'use client';

import { useSubblyCart } from '@/lib/subbly/use-subbly-cart';
import { Button } from '@/components/ui/button';

export default function AddBundleButton({ productId, bundleId }) {
  const { addToCart } = useSubblyCart();
  
  const handleAddBundle = async () => {
    await addToCart({ productId, bundleId });
  };
  
  return (
    <Button onClick={handleAddBundle}>
      Add Bundle to Cart
    </Button>
  );
}
```

#### Using updateCart

```typescript
'use client';

import { useSubblyCart } from '@/lib/subbly/use-subbly-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function CartUpdater() {
  const { updateCart } = useSubblyCart();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const applyCoupon = async () => {
    await updateCart({ couponCode });
  };
  
  return (
    <div>
      <div className="flex gap-2">
        <Input 
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Enter coupon code"
        />
        <Button onClick={applyCoupon} disabled={loading}>
          Apply Coupon
        </Button>
      </div>
    </div>
  );
}
```

#### Gift Subscription Example

```typescript
'use client';

import { useSubblyCart } from '@/lib/subbly/use-subbly-cart';
import { Button } from '@/components/ui/button';

export default function GiftSubscription() {
  const { addToCart, updateCart } = useSubblyCart();
  
  const addGiftSubscription = async (productId: number) => {
    await addToCart({ productId });
    
    await updateCart({
      giftInfo: {
        message: 'Happy Birthday! Enjoy your subscription!',
        numberOfOrders: 6,
        recipientEmail: 'friend@example.com',
        startsAt: '2024-03-01'
      }
    });
  };
  
  return (
    <Button onClick={() => addGiftSubscription(123)}>
      Send as Gift
    </Button>
  );
}
```

## Required Subbly Components for Product and Bundle Pages

When creating product view pages or bundle view pages, you **must** use the following Subbly components to ensure proper functionality. These components handle critical e-commerce logic that should not be modified, but their appearance (HTML/CSS) can be customized to match your design requirements.

### Core Components

```typescript
// Product page components
import { ProductInfoSection } from '@/components/sybbly/product/product-info-section'
import { ProductGallerySection } from '@/components/sybbly/product/images/product-gallery-section'

// Bundle page components
import { BundleInfoSection } from '@/components/sybbly/bundle/bundle-info-section'

// Shared components
import { AddToCartButton } from '@/components/sybbly/add-to-cart-button'
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

### Implementation Example

Here's how to implement these components in your product and bundle pages:

```typescript
// Product page example
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await productBySlug(params.slug);
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="your-custom-container">
      {/* Product gallery must use the Subbly component */}
      <ProductGallerySection
        productName={product.name}
        images={product.images}
        className="your-custom-gallery-class"
      />
      
      {/* Product info must use the Subbly component */}
      <ProductInfoSection
        product={product}
        className="your-custom-info-class"
      />
    </div>
  );
}

// Bundle page example
export default async function BundlePage({ params }: { params: { slug: string } }) {
  const bundle = await bundleBySlug(params.slug);
  let groups = [];
  
  if (bundle?.selectionType === 'single_product') {
    groups = (await loadBundleGroups(bundle.id)).data;
  }
  
  return (
    <div className="your-custom-container">
      {/* Product gallery component is reused for bundles */}
      <ProductGallerySection
        productName={bundle.name}
        images={bundle.images}
        className="your-custom-gallery-class"
      />
      
      {/* Bundle info must use the Subbly component */}
      <BundleInfoSection
        bundle={bundle}
        groups={groups}
        className="your-custom-info-class"
      />
    </div>
  );
}
```

### Important Notes

1. **Do not modify the internal logic** of these components. The business logic handles critical e-commerce functionality including:
   - Variant selection
   - Plan selection
   - Quantity management
   - Add to cart operations
   - Image gallery navigation

2. **You can customize the appearance** by:
   - Adding custom class names to the components
   - Styling the components using CSS/Tailwind
   - Modifying the layout around these components

3. **These components must be used** when creating:
   - Product detail pages
   - Bundle detail pages
   - Any page with add-to-cart functionality

4. **Component dependencies**:
   - These components rely on the Subbly context providers
   - They interact with the Subbly cart system
   - They handle proper data formatting and validation

By following these guidelines, you ensure that the e-commerce functionality works correctly while still allowing for customization of the visual presentation.

## Currency Support

Subbly supports multi-currency functionality through request headers. This allows you to display prices in different currencies based on user preferences.

### Currency Headers

All Subbly fetch functions accept an optional headers parameter that can include currency information:

```typescript
// Example of using currency headers with product functions
const headers = { 'x-currency': 'USD' };

// Use headers with any Subbly fetch function
const products = await listProducts(params, headers);
const product = await productBySlug(slug, headers);
const bundle = await bundleById(id, headers);
```

### Currency Header Examples

Here are some examples of how to use currency headers with different API calls:

```typescript
// List products with EUR currency
const euroProducts = await listProducts({
  page: 1,
  perPage: 20,
  type: 'one_time'
}, { 'x-currency': 'EUR' });

// Get a product with GBP currency
const gbpProduct = await productById(123, { 'x-currency': 'GBP' });

// Get a bundle with USD currency
const usdBundle = await bundleBySlug('premium-bundle', { 'x-currency': 'USD' });
```

The currency header will affect all price-related fields in the response, including:

- Product prices
- Variant prices
- Plan prices
- Bundle prices
- Price schemas and ranges

This allows you to display consistent pricing in the user's preferred currency throughout your application.

## Handling Mentions in User Messages

User messages may contain mentions of specific Subbly entities. These mentions are references to products, bundles, plans, or variants that should be used when calling API functions.

### Mention Format

Mentions appear in user messages using this format:

```xml
<mention:{type} id="{id}">{name}</mention:{type}>
```

### Available Mention Types

- `product` - Products or subscriptions
- `bundle` - Product bundles
- `plan` - Subscription plans (children of products)
- `variant` - Product variants (children of products)

### Finding Mention Details

When a user message contains mentions, detailed information about each mentioned entity will be provided in a section titled `## Mention References` containing JSON objects with the full entity data.

### Using Mentions

When you see a mention in a user message:

1. Extract the `id` attribute from the mention tag
2. Use this ID with the appropriate API function
3. Reference the Mention References section if you need additional entity details

### Examples

```text
User: "Add <mention:product id="23">Premium Subscription</mention:product> to the cart"
→ Use addToCart({ productId: 23 })

User: "Show me details for <mention:bundle id="456">Starter Bundle</mention:bundle>"
→ Use bundleById(456) to fetch bundle details

User: "What's the price of <mention:plan id="789">Monthly Plan</mention:plan>?"
→ Use variantOrPlanById(789) to get plan details

User: "Is <mention:variant id="12">Large Size</mention:variant> in stock?"
→ Use variantOrPlanById(12) to check stock
```

### Notes

- Always use the numeric `id` from the mention when calling API functions
- The mention name is for display purposes and may not match the slug
- Check the Mention References section for complete entity data when needed
- Parent-child relationships: plans and variants belong to products
