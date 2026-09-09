import { expect, test } from "@playwright/test"
import { currentPublishedCanonicalSlug } from "@/lib/airport-directory"
import { readPublishedAirportFacts } from "@/lib/published-airport-facts"

const publishedPage = {
  lifecycle_state: "published" as const,
  current_published_snapshot_id: "published-snapshot-id",
  published_slug: "heathrow-airport-taxi",
}

test("only the current Published Page canonical slug is eligible for discovery", () => {
  expect(currentPublishedCanonicalSlug(publishedPage)).toBe("heathrow-airport-taxi")
  expect(currentPublishedCanonicalSlug({ ...publishedPage, lifecycle_state: "draft" })).toBeNull()
  expect(currentPublishedCanonicalSlug({ ...publishedPage, lifecycle_state: "archived" })).toBeNull()
  expect(currentPublishedCanonicalSlug({ ...publishedPage, current_published_snapshot_id: null })).toBeNull()
  expect(currentPublishedCanonicalSlug({ ...publishedPage, published_slug: "" })).toBeNull()
})

test("a slug publication replaces the obsolete canonical sitemap entry", () => {
  const whileDraftSlugChanges = { ...publishedPage, published_slug: "heathrow-airport-taxi" }
  const afterPublishingSlugChange = { ...publishedPage, published_slug: "london-heathrow-airport-taxi" }

  expect(currentPublishedCanonicalSlug(whileDraftSlugChanges)).toBe("heathrow-airport-taxi")
  expect(currentPublishedCanonicalSlug(afterPublishingSlugChange)).toBe("london-heathrow-airport-taxi")
  expect(currentPublishedCanonicalSlug(afterPublishingSlugChange)).not.toBe("heathrow-airport-taxi")
})

test("public discovery reads airport identity from Published Snapshot facts", () => {
  const publishedFacts = {
    officialName: "Published Airport",
    displayName: "Published name",
    iataCode: "PUB",
    serviceArea: "Published area",
    address: "Published address",
    latitude: 51.5,
    longitude: -0.1,
    googlePlaceId: "published-place-id",
  }

  expect(readPublishedAirportFacts({ publishedFacts, draftFacts: { displayName: "Unpublished edit" } })).toEqual(publishedFacts)
  expect(readPublishedAirportFacts({ displayName: "Mutable page-row edit" })).toBeNull()
})
