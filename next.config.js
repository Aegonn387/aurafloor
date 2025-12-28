/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Keep this for static export
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for static export
  },
}

export default nextConfig;
