/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors in the project
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['cdn.steamstatic.com', 'cdn.cloudflare.steamstatic.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.steamstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 86400, // 24 hours
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false
  },
  webpack: (config, { isServer }) => {
    // Ignore parent directories to prevent Watchpack EACCES errors
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/.git', '/home/*', '!/home/idlemat/htdocs/idlemat.es/**']
    }
    
    return config
  },
  headers: async () => {
    return [
      // Long-term caching for Next.js build assets (hashed filenames)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
