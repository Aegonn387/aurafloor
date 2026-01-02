/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other Next.js config options here (if any)
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
