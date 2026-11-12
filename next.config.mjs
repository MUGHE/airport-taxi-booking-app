import { LEGACY_AIRPORT_REDIRECTS } from './lib/legacy-airport-redirects.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 127.0.0.1: the Playwright configs use it, and dev assets are only served to listed origins.
  allowedDevOrigins: ['192.168.1.10', '127.0.0.1'],
  // Blog images (up to 5 MB, validated in lib/blog.ts) are uploaded through a Server Action.
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
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
    return [
      // The Help Centre was replaced by the FAQs page.
      { source: '/help', destination: '/faqs', permanent: true },
      // The contact and about pages moved to /Contact-Us and /About-Us.
      { source: '/contact', destination: '/Contact-Us', permanent: true },
      { source: '/about', destination: '/About-Us', permanent: true },
      { source: '/route-pages/:slug', destination: '/:slug', permanent: true },
      ...LEGACY_AIRPORT_REDIRECTS.map(([source, destination]) => ({
        source: `/airport-transfers/${source}`,
        destination: `/airport-transfers/${destination}`,
        permanent: true,
      })),
    ]
  },
  // Route pages (lib/route-pages.ts) live at the site root, e.g. /heathrow-to-birmingham-taxi, but are
  // built from app/route-pages/[slug]. Only route-shaped URLs are sent there, so every other unknown
  // root URL stays a real 404, and the internal /route-pages/... address redirects to the public one.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/:slug([a-z0-9-]+-to-[a-z0-9-]+-taxi)', destination: '/route-pages/:slug' }],
    }
  },
  images: {
    // images.unsplash.com hosts the placeholder photography for the /landing-page-new preview.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      // Blog images uploaded to the public Supabase Storage bucket.
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/blog-images/**' },
    ],
  },
}

export default nextConfig
