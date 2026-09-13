import type { PublishedAirportPage } from "@/lib/destination-pages"

const publishedPageCache = new Map<string, PublishedAirportPage>()

export function getSafePublishedAirportPage(slug: string): PublishedAirportPage | undefined {
  return publishedPageCache.get(slug)
}

export function cacheSafePublishedAirportPage(slug: string, page: PublishedAirportPage): void {
  publishedPageCache.set(slug, page)
}

export function invalidateSafePublishedAirportPageCache(): void {
  publishedPageCache.clear()
}

