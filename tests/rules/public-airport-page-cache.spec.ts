import { expect, test } from "@playwright/test"
import { cacheSafePublishedAirportPage, getSafePublishedAirportPage, invalidateSafePublishedAirportPageCache } from "@/lib/public-airport-page-cache"
import type { PublishedAirportPage } from "@/lib/destination-pages"

test("the public fallback cache stores only the supplied Published Page and can be cleared", () => {
  const page = {} as PublishedAirportPage

  invalidateSafePublishedAirportPageCache()
  expect(getSafePublishedAirportPage("example-airport-taxi")).toBeUndefined()

  cacheSafePublishedAirportPage("example-airport-taxi", page)
  expect(getSafePublishedAirportPage("example-airport-taxi")).toBe(page)

  invalidateSafePublishedAirportPageCache()
  expect(getSafePublishedAirportPage("example-airport-taxi")).toBeUndefined()
})

