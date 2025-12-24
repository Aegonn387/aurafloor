/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <-- ADD THIS LINE
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for `output: 'export'`
  },
}

export default nextConfig
