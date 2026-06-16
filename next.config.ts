import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

export default nextConfig
