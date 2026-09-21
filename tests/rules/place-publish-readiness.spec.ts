import { expect, test } from "@playwright/test"
import { createDefaultDestinationContent } from "@/lib/destination-content"
import { getPublishBlockers, type PublishReadinessInput } from "@/lib/publish-readiness"

function validPlace(): PublishReadinessInput {
  const content = createDefaultDestinationContent("Camden Airport Taxi", "place")
  content.hero.body = [{ type: "paragraph", text: "Fixed-price airport transfers from Camden." }]
  content.finalCta.body = [{ type: "paragraph", text: "Get a fixed price for your journey." }]
  for (const section of content.sections) section.body = [{ type: "paragraph", text: `Useful Camden ${section.type} information.` }]
  content.placeFaqs = [1, 2].map((number) => ({ id: `faq-${number}`, question: `Question ${number}`, answer: `Answer ${number}` }))
  return {
    pageType: "place", slug: "camden", officialName: "London Borough of Camden", displayName: "Camden", placeType: "borough", placeGroupId: "london", primaryParentId: "",
    aliases: ["Camden Town"], coveredLocalities: [{ name: "Kentish Town", localityType: "neighbourhood" }], googlePlaceId: "place", address: "Camden, London", latitude: 51.54, longitude: -0.14,
    terminals: [], relatedDestinations: [{ pageId: "heathrow", displayName: "Heathrow", slug: "heathrow-airport-taxi", heading: "Camden to Heathrow", description: "A fixed-price route.", reverseHeading: "Heathrow to Camden", reverseDescription: "A fixed-price route.", kind: "supported_airport", bookingAvailable: true }],
    seoTitle: "Camden Airport Taxi", metaDescription: "Fixed-price transfers between Camden and supported airports.", h1: "Camden Airport Taxi", content,
  }
}

test("a complete Place Draft is publishable", () => { expect(getPublishBlockers(validPlace())).toEqual([]) })

test("Place publication blocks missing bookable airports, local FAQs, and identity", () => {
  const input = validPlace()
  input.relatedDestinations[0].bookingAvailable = false
  input.content.placeFaqs = []
  input.aliases = ["Camden", "camden"]
  expect(getPublishBlockers(input).map((item) => item.code)).toEqual(expect.arrayContaining(["no-bookable-airport", "minimum-faqs", "duplicate-identity"]))
})
