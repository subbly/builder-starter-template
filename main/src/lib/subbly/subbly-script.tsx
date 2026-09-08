import Script from 'next/script'

type SubblyScriptProps = {
  apiKey: string
  apiUrl?: string
  languageCode?: string
  checkoutUrl?: string
  cartSummaryUrl?: string
  disableUrls?: string[]
  settings?: Record<string, unknown>
}

const defaultSettings = {
  interceptProductLinks: true,
  cartCounterEl: '.subbly-cart-product-count',
  cartToggleEl: '.subbly-cart',
}

export const SubblyScript = (props: SubblyScriptProps) => {
  const src = 'https://assets.subbly.co/cart/cart-widget.js'

  const subblyConfig = {
    apiKey: props.apiKey,
    ...(props.apiUrl && { apiUrl: props.apiUrl }),
    ...(props.languageCode && { languageCode: props.languageCode }),
    ...(props.checkoutUrl && { checkoutUrl: props.checkoutUrl }),
    ...(props.cartSummaryUrl && { cartSummaryUrl: props.cartSummaryUrl }),
    ...(props.disableUrls && { disableUrls: props.disableUrls }),
    settings: { ...defaultSettings, ...props.settings },
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
