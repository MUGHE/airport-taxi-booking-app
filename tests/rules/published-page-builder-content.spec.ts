import { expect, test } from "@playwright/test"
import { createDefaultDestinationContent } from "@/lib/destination-content"
import { publishedContentFromSnapshot } from "@/lib/destination-pages"

test("renders the current Page Builder content shape after publishing", () => {
  const draft = createDefaultDestinationContent("Manchester Airport Taxi")
  draft.hero.body = [{ type: "paragraph", text: "A reliable ride to Manchester Airport." }]
  draft.airportFaqs = [
    { id: "faq-1", question: "Where will I meet my driver?", answer: "At the agreed terminal meeting point." },
  ]

  const published = publishedContentFromSnapshot({
    h1: "Manchester Airport Taxi",
    content: draft,
  })

  expect(published.heading).toBe("Manchester Airport Taxi")
  expect(published.intro).toEqual(["A reliable ride to Manchester Airport."])
  expect(published.airportFaqs).toEqual(draft.airportFaqs)
  expect(published.sections).toHaveLength(draft.sections.length)
  expect(published.finalCta).toEqual(draft.finalCta)
})
