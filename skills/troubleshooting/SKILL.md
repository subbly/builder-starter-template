---
name: troubleshooting
description: This guide covers correct Subbly integration, common issues and solutions when working with the Subbly Next.js application. Use this guide to verify and restore essential Subbly configuration files. 
---

## Prerequisites

- A Subbly account with API access
- A Next.js application (App Router)
- Node.js 22+ recommended
- Verify that the Subbly React package is installed (`pnpm add @subbly/react`)

## Configuration

### 1. Environment Variables

**Symptoms:**

- Error message: `Subbly API key not found`
- API calls fail immediately

**Solutions:**

Verify that `.env` file is in the project root:

```env
NEXT_PUBLIC_SUBBLY_API_KEY=your_api_key_here
```

**Important**: The `NEXT_PUBLIC_` prefix is required for the variable to be accessible in the browser.

> Visit [API keys](https://www.subbly.co/admin/settings/api-keys) page to get a Storefront API key


Environment variable naming example:
```typescript
// Correct
process.env.NEXT_PUBLIC_SUBBLY_API_KEY

// Wrong - won't work client-side
process.env.SUBBLY_API_KEY
```

### 2. Verify Subbly integration

#### Subbly API initialization

**Symptoms:**

- `"subblyApi is not initialized"` error
- Methods like `subblyApi.product.list()` fail immediately

**Solutions:**

Subbly API client is initialized in `src/lib/subbly/api.ts`. Import this file in the `app/layout.tsx` to
ensure that the API client is initialized first.

Import example in `layout.tsx`
```ts
// Correct
import '@/lib/subbly/api'

// Wrong - this import is only works after initialization
import { subblyApi } from '@subbly/react'
```

File examples examples:

`src/lib/subbly/api.ts`
```typescript
/**
 * This file shows the correct subblyApi initialization
 * and MUST exist in src/lib/subbly/api.ts of the project.
 *
 * Avoid modifying this file and use it to restore the correct initialization of subblyApi.
 */

import { subblyApi } from '@subbly/react'

if (!process.env.NEXT_PUBLIC_SUBBLY_API_KEY) {
   throw new Error('Subbly API key not found. Please add it to the .env file.')
}

subblyApi.initialize({
   apiKey: process.env.NEXT_PUBLIC_SUBBLY_API_KEY as string,
})

export { subblyApi }
```

In `src/app/layout.tsx`
```typescript
import '@/lib/subbly/api' // This executes initialization
```

#### Add the Subbly Provider

**Symptoms:**

- Hooks return undefined
- Context errors in console

**Solution:**

Wrap the application with the `SubblyProvider` imported from `@subbly/react` package.

```tsx
// app/layout.tsx
import { SubblyProvider } from '@subbly/react'

export default function RootLayout ({ children }) {
  return (
    <html>
      <body>
        <SubblyProvider>
          { children }
       </SubblyProvider>
      </body>
    </html>
  )
}
```

#### Verify Subbly Widget script is included

**Symptoms:**

- Cart doesn't open
- `getWidget()` returns null
- No Subbly elements in DOM

**Solutions:**

1. Verify the validity of the `SubblyScript` component file and that it's loaded in the app layout:

```tsx
// src/lib/subbly/subbly-script.tsx
import Script from 'next/script'

type SubblyScriptProps = {
  apiKey: string
}

export const SubblyScript = (props: SubblyScriptProps) => {
  const src = 'https://assets.subbly.co/cart/cart-widget.js'

  const subblyConfig = {
    apiKey: props.apiKey,
    settings: {
      interceptProductLinks: true,
      cartCounterEl: '.subbly-cart-product-count',
      cartToggleEl: '.subbly-cart',
    },
  }

  return (
    <>
      <Script id="subblyCartWidgetScript" type="module" defer src={src} />

      <Script id="subblyConfigScript">
        {`window.subblyConfig = ${JSON.stringify(subblyConfig)}`}
      </Script>
    </>
  )
}

// src/app/layout.tsx

import { SubblyProvider } from '@subbly/react'
import { SubblyScript } from '@/lib/subbly/subbly-script'
import '@/lib/subbly/api'

export default function RootLayout ({ children }) {
  return (
    <html lang="en">
    <body>
    {process.env.NEXT_PUBLIC_SUBBLY_API_KEY && (
      <SubblyScript
        apiKey={process.env.NEXT_PUBLIC_SUBBLY_API_KEY}
      />
    )}
    <SubblyProvider>
      {children}
    </SubblyProvider>
    </body>
    </html>
  )
}
```

2. Check browser Network tab for script loading:
   - Open DevTools > Network
   - Filter by "cart-widget.js"
   - Verify status is 200

3. Check for JavaScript errors blocking execution:
   - Open DevTools > Console
   - Look for errors before widget initialization

**Solutions:**

- Verify the Subbly script is included in the `layout.tsx` or on the requested page.
- Check for JavaScript errors in the browser console.
- Ensure the script URL is correct: `https://assets.subbly.co/cart/cart-widget.js` and the script has `type="module"`
  attribute.

Verify that the `SubblyScript` is included on the page. It is recommended to include `SubblyScript` in the
main `layout.tsx` to make it available on every page.
The `SubblyScript` component is imported from `src/lib/subbly/subbly-script.tsx`.
Use [subbly-script](templates/subbly-script.tsx) template to verify that the script file content.

### Complete integration example

See [layout.tsx](templates/layout.tsx) template for correct integration example in the `layout.tsx` of Next.js
application.

`src/app/layout.tsx`
```tsx
/**
 * This file provides a barebones example for src/app/layout.tsx file with Subbly integration essentials in the Next.js application.
 *
 * Use this file as guidance to verify the correct integration.
 */

import { SubblyProvider } from '@subbly/react'
import { SubblyScript } from '@/lib/subbly/subbly-script'
import '@/lib/subbly/api'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {process.env.NEXT_PUBLIC_SUBBLY_API_KEY && <SubblyScript apiKey={process.env.NEXT_PUBLIC_SUBBLY_API_KEY} />}
        <SubblyProvider>{children}</SubblyProvider>
      </body>
    </html>
  )
}

```

### Other common issues

#### Cart Not Opening

**Symptoms:**

- `addToCart()` executes but cart doesn't appear
- No visible widget UI

**Solutions:**

1. Wait for widget to be ready:

```typescript
const { addToCart, getWidget } = useSubblyCart()

const handleAddToCart = async () => {
  // Ensure widget is ready
  const widget = await getWidget()
  if (!widget) {
    console.error('Widget not ready')
    return
  }

  await addToCart({ productId, quantity: 1 })
}
```

2. Verify event name is correct (case-sensitive):

```typescript
// Correct
widget.events.on('CART_UPDATED', handler)
widget.events.on('PURCHASE_COMPLETED', handler)

// Wrong
widget.events.on('cart_updated', handler)
widget.events.on('CartUpdated', handler)
```

#### subblyApi returns 404 Not Found

**Symptoms:**

- `bySlug()` or `byId()` returns 404
- Product or bundle not found

**Solutions:**

1. Verify the slug/ID exists in Subbly dashboard
2. Check for typos in slug:

```typescript
// Slugs are case-sensitive
await subblyApi.product.bySlug('My-Product')   // Wrong
await subblyApi.product.bySlug('my-product')   // Correct
```

3. Ensure product is published and visible to storefront

#### Network Errors

**Symptoms:**

- CORS errors in console
- Fetch failed errors

**Solutions:**

1. For client-side requests, ensure you're using the SDK (handles CORS)
2. Verify network connectivity

#### TypeScript Errors

##### Type Import Errors

**Symptoms:**

- Cannot find type definitions
- Import errors for types

**Solutions:**

1. Import types from `@subbly/react`:

```typescript
import type {
  ParentProduct,
  ProductSubscription,
  ProductOneTime,
  Bundle,
  BundleItem,
  Metafield,
} from '@subbly/react'
```

2. Use type-only imports for types:

```typescript
// Correct
import type { ParentProduct } from '@subbly/react'

// Also correct
import { type ParentProduct, useProductForm } from '@subbly/react'
```

#### Hook Return Type Errors

**Symptoms:**

- Hook return values have wrong types
- TypeScript complains about undefined

**Solutions:**

1. Handle nullable returns:

```typescript
const { getCart, getWidget } = useSubblyCart()

const cart = await getCart()
if (cart) {
  // cart is SubblyCart here
  console.log(cart.total)
}

const widget = await getWidget()
if (widget) {
  // widget is SubblyCartWidgetInstance here
  widget.open()
}
```

2. Use type guards:

```typescript
function isSubscriptionProduct (
  product: ParentProduct
): product is ProductSubscription {
  return product.type === 'subscription'
}

if (isSubscriptionProduct(product)) {
  // product.plans is available
}
```

#### Bundle Configuration Issues

##### Items Not Selectable

**Symptoms:**

- Can't add items to bundle
- `canSelectItem()` always returns false

**Solutions:**

1. Check ruleset is selected:

```typescript
const { rulesetId, setRulesetId, rulesetOptions } = useBundleForm({ bundle })

// Ensure a ruleset is selected
useEffect(() => {
  if (!rulesetId && rulesetOptions.length > 0) {
    setRulesetId(rulesetOptions[0].id)
  }
}, [rulesetId, rulesetOptions, setRulesetId])
```

2. Verify items are fetched for the correct bundle:

```typescript
const items = await subblyApi.bundle.listItems(bundle.id, { perPage: 100 })
```

3. Check stock availability:

```typescript
const canSelect = item.stockCount === null || item.stockCount > 0
```

### Validation Errors

**Symptoms:**

- Can't add bundle to cart
- Validation fails

**Solutions:**

1. Use `useBundleValidation` to check errors:

```typescript
const { validation } = useBundleValidation({
  bundle,
  form,
  ruleset: selectedRuleset,
})

if (validation) {
  console.log('Validation error:', validation.key)
  console.log('Expected:', validation.expected)
  console.log('Current:', validation.current)
  console.log('Need:', validation.delta)
}
```

2. Check ruleset requirements:

```typescript
// For quantity-based rulesets
console.log('Min quantity:', selectedRuleset?.minQuantity)
console.log('Max quantity:', selectedRuleset?.maxQuantity)

// For total-based rulesets
console.log('Min total:', selectedRuleset?.minTotal)
console.log('Max total:', selectedRuleset?.maxTotal)
```

### Error Message Reference

| Error                          | Cause                        | Solution                                     |
|--------------------------------|------------------------------|----------------------------------------------|
| `API key not found`            | Missing environment variable | Add `NEXT_PUBLIC_SUBBLY_API_KEY` to `.env`   |
| `subblyApi is not initialized` | `initialize()` not called    | Call `subblyApi.initialize()` at app startup |
| `Widget not ready`             | Script not loaded            | Ensure widget script is in DOM               |
| `Product not found`            | Invalid slug/ID              | Verify product exists in Subbly              |
| `Invalid coupon code`          | Coupon expired/invalid       | Check coupon in Subbly dashboard             |
| `Ruleset validation failed`    | Bundle requirements not met  | Check min/max quantity or total              |
| `Stock unavailable`            | Item out of stock            | Check `stockCount` before adding             |

## Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Review the Network tab for API response details
3. Verify your Subbly dashboard configuration
4. Contact Subbly support with error details and reproduction steps
