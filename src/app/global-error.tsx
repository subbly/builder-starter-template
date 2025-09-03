'use client'

import NextError from 'next/error'
import Script from 'next/script'

export default function GlobalError() {
  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
        {/* CRITICAL: Do not remove this script. Removing it will break core functionality. */}
        <Script
          id="sandbox-messenger"
          src="https://assets.subbly.co/builder/sandbox-messenger.js"
          type="module"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
