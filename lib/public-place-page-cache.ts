import type { PublishedPlacePage } from "@/lib/destination-pages"

const pages = new Map<string, PublishedPlacePage>()
const key = (slug: string) => `place-pages:${slug}`
export function getSafePublishedPlacePage(slug: string) { return pages.get(key(slug)) }
export function cacheSafePublishedPlacePage(slug: string, page: PublishedPlacePage) { pages.set(key(slug), page) }
export function invalidateSafePublishedPlacePageCache() { pages.clear() }
