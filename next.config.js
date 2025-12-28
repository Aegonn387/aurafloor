/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // Exclude problematic dynamic API routes from build
  experimental: {
    isrMemoryCacheSize: 0,
  },
}

export default nextConfig;
