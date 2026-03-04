---
name: localization
description: Use this skill when user wants to add multi-currency or multi-language support to Subbly Next.js application. This skill includes `next-intl` setup, language and currency formatting, creating a language switch component, using currency in API requests, and setting currency, language in the Subbly cart widget.
---

# Multi-language Support and Localization

This guide provides reference documentation for adding location to Subbly Next.js application.
Include relevant reference files when working on a specific feature.
`next-intl` package is the recommended way to handle localization — always include them when working with products.

`@subbly/api-client` package is the source of all type references and API client. However, the `@subbly/react` package
re-exports all types from `@subbly/api-client`. When importing types in the project, prefer using the `@subbly/react`
package.

## Implementing multi-language support

Subbly supports multiple currencies for international stores. Currency affects all price-related fields throughout the API.

Do not proactively implement multi-language support. Only implement multi-language support when the user explicitly requests it.

- Always use `next-intl` package for multi-language support. Install with: `pnpm install next-intl`.
- This project uses the App Router configuration for `next-intl`.
- **Default approach**: Use routing-based locale prefixes (e.g., `/en`, `/es`, `/fr`, `/de`) for better SEO performance and crawlability. Only use cookies or localStorage if explicitly requested.

### Routing-Based Setup (Default)

When implementing routing-based locales:

- **Critical**: Create `src/middleware.ts` for Next.js 15 or `src/proxy.ts` for Next.js 16 using `createMiddleware` from `next-intl/middleware` to handle locale detection and routing. Without this, routing-based locales will not work.
- Move the existing `src/app/layout.tsx` body tag content to `src/app/[locale]/layout.tsx`. `src/app/layout.tsx` must preserve html, head, body tags, revalidate setting and include the locale (using `getLocale()` from `next-intl/server`) in the html tag.
- Setup `src/i18n/navigation.ts` using `createNavigation` from `next-intl/navigation` to create locale-aware navigation helpers (Link, redirect, useRouter, usePathname).
- For language switchers, use full page refresh (`window.location.href = newLocaleUrl`) instead of client-side navigation to ensure complete locale context reset.

### Configuration

- Configure locale settings in `src/i18n/request.ts`.
- For text translations, use the `useTranslations` hook from `next-intl` and call the returned `t` function.
- For date/number formatting, use the `useFormatter` hook from `next-intl` and call the returned `format` function.

### Setting Subbly widget Language

```typescript
import { useSubblyCart } from '@subbly/react'

const { getWidget } = useSubblyCart()

const widget = getWidget()
widget?.setLanguage('de') // German
widget?.setLanguage('fr') // French
widget?.setLanguage('en') // English
```

### Complete Language Switcher Example

```tsx
'use client'

import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { useSubblyCart } from '@subbly/react'
import { useEffect } from 'react'

type Language = {
  code: string
  name: string
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
]

let widgetLanguageSet = false

export function LanguageSwitcher () {
  const { getWidget } = useSubblyCart()
  const locale = useLocale()
  const pathname = usePathname()

  const widget = getWidget()

  useEffect(() => {
    if (!widgetLanguageSet && widget && widget.state.languageCode !== locale) {
      widget.setLanguage(locale)
      widgetLanguageSet = true
    }
  }, [widget])

  const handleLanguageChange = async (langCode: string) => {
    // Sync Subbly widget language
    widget?.setLanguage(langCode)

    // Navigate to the locale-prefixed URL with a full page refresh
    // to ensure complete locale context reset
    window.location.href = `/${langCode}${pathname}`
  }

  return (
    <div>
      <label htmlFor="language">Language:</label>
      <select
        id="language"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### Reading Current Language

```typescript
const widget = getWidget()
console.log('Current language:', widget?.state.languageCode)
```

## Adding multi-currency support

### Setting Currency in API Calls

All API methods accept a `headers` parameter for currency:

```typescript
import { subblyApi } from '@/lib/subbly'

const headers = { 'x-currency': 'EUR' }

// Products
const products = await subblyApi.product.list({ page: 1 }, headers)
const product = await subblyApi.product.bySlug('my-product', null, headers)
const variant = await subblyApi.product.variantById(123, null, headers)
const plan = await subblyApi.product.planById(456, null, headers)

// Bundles
const bundles = await subblyApi.bundle.list({ page: 1 }, headers)
const bundle = await subblyApi.bundle.bySlug('custom-box', null, headers)
const items = await subblyApi.bundle.listItems(789, { page: 1 }, headers)
const groups = await subblyApi.bundle.listGroups(789, { page: 1 }, headers)
```

### Format currency

When displaying prices in the UI, prefer the `useFormatAmount` hook that is using `next-intl` formatter.  
The `useFormatAmount` hook can be imported from `@/hooks/use-format-amount`.

**`@/hooks/use-format-amount.ts`**

```ts
import { useFormatter } from 'next-intl'

export const useFormatAmount = () => {
  const format = useFormatter()

  const formatAmount = (amount: number) => {
    return format.number(amount / 100, {
      style: 'currency',
      currency: process.env.NEXT_PUBLIC_SHOP_CURRENCY || 'USD',
    })
  }

  return {
    formatAmount,
  }
}

```

Alternatively, use `useCurrencyFormatter` from `@subbly/react` package.

### Setting Cart Currency

```typescript
import { useSubblyCart } from '@subbly/react'

const { updateCart, getWidget } = useSubblyCart()

// Via updateCart
await updateCart({ currencyCode: 'EUR' })

// Via widget
const widget = getWidget()
await widget?.setCurrency('EUR')
```

### Reading Cart Currency

```typescript
const { getCart, getWidget } = useSubblyCart()

// From cart
const cart = await getCart()
console.log('Cart currency:', cart?.currencyCode)

// From widget state
const widget = getWidget()
console.log('Widget currency:', widget?.state.currencyCode)
```

### Currency Persistence with HTTP-Only Cookie

For secure currency persistence across sessions, use an HTTP-only cookie managed through API route handlers. This prevents client-side tampering and ensures the currency is available during server-side rendering.

#### API Route — GET and POST

**`app/api/currency/route.ts`**

```ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
]

const DEFAULT_CURRENCY = 'USD'

export async function GET() {
  const cookieStore = await cookies()
  const active = cookieStore.get('currency')?.value || DEFAULT_CURRENCY

  return NextResponse.json({ active, currencies: CURRENCIES })
}

export async function POST(request: Request) {
  const { currency } = await request.json()

  if (!CURRENCIES.some(c => c.code === currency)) {
    return NextResponse.json(
      { error: `Unsupported currency: ${currency}` },
      { status: 400 },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set('currency', currency, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  return NextResponse.json({ active: currency, currencies: CURRENCIES })
}
```

#### Server Page — Reading Currency from Cookie

**`app/products/page.tsx`**

```tsx
import { cookies } from 'next/headers'
import { subblyApi } from '@/lib/subbly'
import { CurrencySwitcher } from '@/components/currency-switcher'

export default async function ProductsPage() {
  const cookieStore = await cookies()
  const currency = cookieStore.get('currency')?.value || 'USD'

  const headers = { 'x-currency': currency }
  const response = await subblyApi.product.list({ page: 1 }, headers)

  return (
    <div>
      <CurrencySwitcher currentCurrency={currency} />
      {response.data.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
        </div>
      ))}
    </div>
  )
}
```

#### Currency Switcher with POST Request

**`components/currency-switcher.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useSubblyCart } from '@subbly/react'

type Currency = {
  code: string
  name: string
}

export function CurrencySwitcher({ currentCurrency }: { currentCurrency: string }) {
  const { getWidget } = useSubblyCart()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch available currencies from the API
  useEffect(() => {
    fetch('/api/currency')
      .then(res => res.json())
      .then(data => setCurrencies(data.currencies))
  }, [])

  const handleCurrencyChange = async (currencyCode: string) => {
    setIsLoading(true)
    try {
      // Persist currency in HTTP-only cookie
      await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: currencyCode }),
      })

      // Sync widget currency
      const widget = getWidget()
      await widget?.setCurrency(currencyCode)

      // Reload to re-fetch data with new currency on the server
      window.location.reload()
    } catch (error) {
      console.error('Failed to change currency:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <select
      value={currentCurrency}
      onChange={(e) => handleCurrencyChange(e.target.value)}
      disabled={isLoading}
    >
      {currencies.map(c => (
        <option key={c.code} value={c.code}>
          {c.code} - {c.name}
        </option>
      ))}
    </select>
  )
}
```

### Product Listing with Currency

### Server-Side Currency Handling

**Important**: always prefer using server-side currency handling for SEO.
For server-side rendering, pass currency from headers or cookies:

```tsx
// app/products/page.tsx
import { subblyApi } from '@/lib/subbly'
import { cookies } from 'next/headers'

export default async function ProductsPage() {
  const cookieStore = await cookies()
  const currency = cookieStore.get('currency')?.value || 'USD'

  const headers = { 'x-currency': currency }
  const response = await subblyApi.product.list({ page: 1 }, headers)

  return (
    <div>
      {response.data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Client-Side Currency Handling

In some cases the data is loaded on the client, then pass currency as a prop and reload the data when `currencyCode` prop changes.

```tsx
'use client'

import { useState, useEffect } from 'react'
import { subblyApi, useCurrencyFormatter } from '@subbly/react'
import type { ParentProduct } from '@subbly/react'

export function ProductGrid({ currencyCode }: { currencyCode: string }) {
  const [products, setProducts] = useState<ParentProduct[]>([])
  const { formatAmount } = useCurrencyFormatter()

  useEffect(() => {
    const headers = { 'x-currency': currencyCode }

    subblyApi.product.list({ page: 1, perPage: 12 }, headers)
      .then(response => setProducts(response.data))
  }, [currencyCode])

  return (
    <div>
      {products.map(product => {
        // Get minimum price
        const minPrice = product.type === 'subscription'
          ? Math.min(...product.plans.map(p => p.price))
          : Math.min(...product.variants.map(v => v.price))

        return (
          <div key={product.id}>
            <h3>{product.name}</h3>
            <p>From {formatAmount(minPrice)}</p>
          </div>
        )
      })}
    </div>
  )
}
```

### Currency Context Pattern

For app-wide currency management:

```tsx
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useCurrencyFormatter, useSubblyCart } from '@subbly/react'

type CurrencyContextType = {
  currency: string
  locale: string
  setCurrency: (code: string, locale: string) => Promise<void>
  formatAmount: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('USD')
  const [locale, setLocale] = useState('en-US')
  const { setCurrency: setFormatterCurrency, formatAmount } = useCurrencyFormatter()
  const { getWidget } = useSubblyCart()

  const setCurrency = useCallback(async (code: string, newLocale: string) => {
    // Update formatter
    setFormatterCurrency(newLocale, code)

    // Update widget
    const widget = getWidget()
    await widget?.setCurrency(code)

    // Update state
    setCurrencyState(code)
    setLocale(newLocale)
  }, [setFormatterCurrency, updateCart, getWidget])

  return (
    <CurrencyContext.Provider value={{ currency, locale, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}
```

Usage:

```tsx
'use client'

import { useCurrency } from '@/providers/currency-provider'

export function PriceDisplay({ price }: { price: number }) {
  const { formatAmount } = useCurrency()
  return <span>{formatAmount(price)}</span>
}

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <select
      value={currency}
      onChange={(e) => {
        const locales: Record<string, string> = {
          USD: 'en-US',
          EUR: 'de-DE',
          GBP: 'en-GB',
        }
        setCurrency(e.target.value, locales[e.target.value])
      }}
    >
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
  )
}
```


| Feature                  | Reference                        |
--------------------------|----------------------------------|
| Localization React hooks | references/hooks.md              |

