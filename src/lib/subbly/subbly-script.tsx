import Script from 'next/script'
import type { ConfigureItemPayload } from '@/lib/subbly/types'

declare global {
  interface Window {
    subblyCart?: {
      configureItem: (payload: ConfigureItemPayload) => void
    }
  }
}

export const SubblyScript = () => {
  const src = 'https://assets.subbly.co/cart/cart-widget.js'

  const subblyConfig = {
    apiKey: process.env.NEXT_PUBLIC_SUBBLY_API_KEY || '',
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
