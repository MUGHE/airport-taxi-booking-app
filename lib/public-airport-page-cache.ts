import type { PublishedAirportPage } from "@/lib/destination-pages"
import { getDestinationPagePolicy } from "@/lib/destination-page-policy"

const publishedPageCache = new Map<string, PublishedAirportPage>()
const cacheNamespace = getDestinationPagePolicy("airport").public.cacheNamespace

function cacheKey(slug: string) {
  return `${cacheNamespace}:${slug}`
}

export function getSafePublishedAirportPage(slug: string): PublishedAirportPage | undefined {
  return publishedPageCache.get(cacheKey(slug))
}

export function cacheSafePublishedAirportPage(slug: string, page: PublishedAirportPage): void {
  publishedPageCache.set(cacheKey(slug), page)
}

export function invalidateSafePublishedAirportPageCache(): void {
  publishedPageCache.clear()
}
