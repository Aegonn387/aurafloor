/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other Next.js config options here (if any)
  async redirects() {
    return [
      {
        source: '/.well-known/:path*', // Matches /.well-known/pi.toml
        destination: '/well-known/:path*', // Redirects to /well-known/pi.toml
        permanent: true, // Uses a 308 permanent redirect
      },
    ]
  },
}

module.exports = nextConfig
