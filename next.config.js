/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsHmrCache: false },
  transpilePackages: ["@allauth/react"],
  serverExternalPackages: ["@prisma/client"],
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap-index',
      },
    ]
  },
}

module.exports = nextConfig 