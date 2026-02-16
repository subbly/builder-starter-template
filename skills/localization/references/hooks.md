# Localization hooks

## useCurrencyFormatter Hook

The `useCurrencyFormatter` hook formats prices with proper locale and currency symbols.

```typescript
import { useCurrencyFormatter } from '@subbly/react'

const { formatAmount, setCurrency } = useCurrencyFormatter()

// Format a price (prices are stored in cents)
const formatted = formatAmount(1999) // "$19.99"

// Change currency/locale
setCurrency('de-DE', 'EUR')
const euroPrice = formatAmount(1999) // "19,99 €"
```

### Props & Returns

```typescript
const useCurrencyFormatter = () => {
  return {
    // Format amount in cents to currency string
    formatAmount: (amount: number) => string

    // Set the locale and currency for formatting
    setCurrency: (locale: string, currencyCode: string) => void
  }
}
```

### Usage Example

```tsx
'use client'

import { useCurrencyFormatter } from '@subbly/react'
import type { ProductVariant } from '@subbly/react'

export function ProductPrice({ variant }: { variant: ProductVariant }) {
  const { formatAmount } = useCurrencyFormatter()

  return (
    <div>
      <span>{formatAmount(variant.price)}</span>
    </div>
  )
}
```