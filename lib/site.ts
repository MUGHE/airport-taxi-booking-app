// Canonical site URL for metadata (metadataBase, robots.txt, sitemap.xml). Reuses the same
// env var as the app URL used for redirects/emails so there's a single source of truth.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://oneairporttaxi.com").replace(/\/+$/, "")
