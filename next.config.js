/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
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

module.exports = nextConfig
