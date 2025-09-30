/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable Next.js built-in image optimization so external images from any host
    // can be used without configuring remotePatterns. Useful for development.
    // Note: setting `unoptimized: true` disables optimization/loader and may
    // impact performance in production — consider reverting and whitelisting
    // domains via `remotePatterns` for production deployments.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vendorapi.amrod.co.za',
      },
      {
        protocol: 'https',
        hostname: 'jucycorporategifts.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig