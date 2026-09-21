import { expect, test } from "@playwright/test"
import { cacheSafePublishedPlacePage, getSafePublishedPlacePage, invalidateSafePublishedPlacePageCache } from "@/lib/public-place-page-cache"
import type { PublishedPlacePage } from "@/lib/destination-pages"

test("Place fallback cache is isolated from Airport cache and can be cleared", () => {
  const page = {} as PublishedPlacePage
  invalidateSafePublishedPlacePageCache()
  expect(getSafePublishedPlacePage("camden")).toBeUndefined()
  cacheSafePublishedPlacePage("camden", page)
  expect(getSafePublishedPlacePage("camden")).toBe(page)
  invalidateSafePublishedPlacePageCache()
  expect(getSafePublishedPlacePage("camden")).toBeUndefined()
})
