/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for Android/Termux permission errors
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          '**/.next',
          '/data/**',
          '/data/data/**',
          '/**'
        ].filter(Boolean)
      };
    }
    return config;
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

module.exports = nextConfig;
