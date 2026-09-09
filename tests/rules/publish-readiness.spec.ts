import { expect, test } from "@playwright/test"
import { createDefaultDestinationContent } from "@/lib/destination-content"
import { getPublishBlockers, type PublishReadinessInput } from "@/lib/publish-readiness"

function validInput(): PublishReadinessInput {
  const content = createDefaultDestinationContent("Example Airport Taxi")
  content.hero.body = [{ type: "paragraph", text: "A useful airport introduction." }]
  content.hero.image = { assetId: "asset", publicId: "example", secureUrl: "https://cdn.example/image.webp", width: 1600, height: 900, format: "webp", altText: "Example Airport" }
  content.finalCta.body = [{ type: "paragraph", text: "Get your fixed price today." }]
  for (const section of content.sections) section.body = [{ type: "paragraph", text: `Useful ${section.type} information.` }]
  content.airportFaqs = [1, 2, 3].map((number) => ({ id: `faq-${number}`, question: `Question ${number}`, answer: `Answer ${number}` }))
  return { slug: "example-airport-taxi", officialName: "Example Airport", displayName: "Example", iataCode: "EXM", serviceArea: "Example", googlePlaceId: "place", address: "Example Airport, UK", latitude: 51, longitude: -0.1, terminals: [{ displayName: "Main Terminal", address: "Example Airport", latitude: 51, longitude: -0.1, sortOrder: 0, isPrimary: true }], relatedDestinations: [1, 2, 3].map((number) => ({ pageId: `page-${number}`, displayName: `Airport ${number}`, slug: `airport-${number}-airport-taxi`, heading: "To this airport", description: "A route", reverseHeading: "From this airport", reverseDescription: "A route" })), seoTitle: "Example Airport Taxi", metaDescription: "Fixed price transfers to Example Airport.", h1: "Example Airport Taxi", content }
}

test("valid content has no publish blockers", () => { expect(getPublishBlockers(validInput())).toEqual([]) })
test("publish readiness classifies invalid slug, minimum counts, and required content", () => {
  const input = validInput()
  input.slug = "Example Airport"
  input.relatedDestinations = []
  input.content.airportFaqs = []
  input.content.sections.find((section) => section.type === "map")!.visible = false
  const blockers = getPublishBlockers(input)
  expect(blockers.map((item) => item.code)).toEqual(expect.arrayContaining(["invalid-slug", "minimum-faqs", "minimum-related-pages", "missing-map"]))
})
test("unsafe and broken links block publication", () => {
  const input = validInput()
  input.content.sections[0].body = [{ type: "link", text: "Bad", href: "javascript:alert(1)", label: "Bad" }]
  expect(getPublishBlockers(input).map((item) => item.code)).toContain("unsafe-link")
})
test("duplicate slug, IATA code, or SEO title is a publish blocker", () => {
  const input = validInput()
  input.existingPages = [{ id: "other", slug: input.slug, iataCode: input.iataCode, seoTitle: input.seoTitle }]
  expect(getPublishBlockers(input).map((item) => item.code)).toContain("duplicate-value")
})
