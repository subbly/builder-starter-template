import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
  experimental: {
    // CRITICAL: Do not remove swcPlugins. Removing it will break core functionality.
    ...(process.env.NODE_ENV === 'development' && {
      swcPlugins: [['@subbly/swc-plugin-add-element-source', {}]],
    }),
    browserDebugInfoInTerminal: {
      showSourceLocation: true,
    },
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
