import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // REMOVED: output: 'export' - using standard Next.js build
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,  // Still ignore TypeScript errors
  },
}

export default nextConfig
