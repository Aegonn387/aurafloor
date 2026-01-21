import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          '**/.next',
          '/data/**',
          '/data/data/**',
        ].filter(Boolean)
      }
    }
    
    config.infrastructureLogging = {
      level: 'error',
    }
    
    return config
  },
  async redirects() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/well-known/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
