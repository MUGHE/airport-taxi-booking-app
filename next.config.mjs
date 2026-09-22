import { LEGACY_AIRPORT_REDIRECTS } from './lib/legacy-airport-redirects.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.10'],
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
