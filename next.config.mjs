import { LEGACY_AIRPORT_REDIRECTS } from './lib/legacy-airport-redirects.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.10'],
  // Account pages (sign-in, codes, password reset) can't be framed by another site
  // (clickjacking), leak nothing via the Referer header, and are never cached.
  async headers() {
    const accountHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Cache-Control', value: 'no-store, max-age=0' },
    ]
    return [
      { source: '/account', headers: accountHeaders },
      { source: '/account/:path*', headers: accountHeaders },
    ]
  },
  async redirects() {
    return LEGACY_AIRPORT_REDIRECTS.map(([source, destination]) => ({
      source: `/airport-transfers/${source}`,
      destination: `/airport-transfers/${destination}`,
      permanent: true,
    }))
  },
  images: {
    // images.unsplash.com hosts the placeholder photography for the /landing-page-new preview.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
}

export default nextConfig
