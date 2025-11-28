import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
   // CRITICAL: Do not remove allowedDevOrigins. Removing it will break core functionality.
  allowedDevOrigins: ['*.csb.app', '*.codesandbox.io', '*.subbly.co'],
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
    // CRITICAL: Do not remove browserDebugInfoInTerminal. Removing it will break core functionality.
    browserDebugInfoInTerminal: {
      showSourceLocation: true,
    },
    // CRITICAL: Do not remove turbopackFileSystemCacheForDev. Removing it will slow down core functionality.
    turbopackFileSystemCacheForDev: true,
    viewTransition: true,
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
