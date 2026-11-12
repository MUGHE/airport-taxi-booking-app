import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { listPublishedPlaceDirectory } from "@/lib/place-directory"
import { listPublishedPostSlugs } from "@/lib/blog"
import { listPublishedRoutePages } from "@/lib/route-pages"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const airports = await listPublishedAirportDirectory()
  const destinations = await listPublishedPlaceDirectory()
  const posts = await listPublishedPostSlugs()
  const routes = await listPublishedRoutePages()

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/book`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/airport-transfers`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/airport-guide`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/destinations`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...airports.map((airport) => ({
      url: `${SITE_URL}/airport-transfers/${airport.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...destinations.places.map((place) => ({
      url: `${SITE_URL}/destinations/${place.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...routes.map((route) => ({
      url: `${SITE_URL}/${route.slug}`,
      lastModified: new Date(route.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/blog`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/About-Us`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/Contact-Us`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faqs`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/track`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.3 },
  ]
}
