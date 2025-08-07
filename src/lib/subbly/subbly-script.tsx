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
