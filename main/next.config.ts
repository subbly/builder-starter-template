import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
   // CRITICAL: Do not remove allowedDevOrigins. Removing it will break core functionality.
  allowedDevOrigins: ['*.subbly.co', '*.preview.subbly.site'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'subbly-builder.nyc3.cdn.digitaloceanspaces.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.filestackcontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '**',
      },
    ],
  },
  // CRITICAL: Do not apply Cache-Control headers outside of production. Caching assets in development may cause hydration errors.
  ...(process.env.NODE_ENV === 'production' && {
    headers() {
      return [
        {
          source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf|otf|pdf|mp4|webm)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/:path*.js',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/:path*.css',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ]
    },
  }),
  // CRITICAL: Do not remove logging.browserToTerminal. Removing it will break core functionality.
  logging: {
    browserToTerminal: true,
  },
  experimental: {
    // CRITICAL: Do not remove swcPlugins. Removing it will break core functionality.
    ...(process.env.NODE_ENV === 'development' && {
      swcPlugins: [['@subbly/swc-plugin-add-element-source', {}]],
    }),
    // CRITICAL: Do not remove turbopackFileSystemCacheForDev. Removing it will slow down core functionality.
    turbopackFileSystemCacheForDev: true,
    viewTransition: true,
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
