import { expect, test } from "@playwright/test"
import { createDefaultDestinationContent, normalizeDestinationContent, validateDestinationContent } from "@/lib/destination-content"
import { publishedContentFromSnapshot } from "@/lib/destination-pages"

test("a new Airport Page starts with the Who we drive and Places you can book from sections", () => {
  const content = createDefaultDestinationContent("Exeter Airport Taxi")
  const travellers = content.sections.find((section) => section.type === "traveller_types")
  const places = content.sections.find((section) => section.type === "place_links")

  expect(travellers?.required).toBe(false)
  expect(travellers?.items?.map((item) => item.icon)).toEqual(["family", "business", "group", "long_distance"])
  expect(places?.required).toBe(false)
  expect(places?.items).toEqual([])
  expect(places?.fields).toEqual({ listHeading: "", closing: "", cta: "" })
  expect(validateDestinationContent(content, "Exeter Airport Taxi")).toBeNull()
})

test("Place Pages don't get the airport card sections", () => {
  const types = createDefaultDestinationContent("Reading Airport Taxi", "place").sections.map((section) => section.type)
  expect(types).not.toContain("traveller_types")
  expect(types).not.toContain("place_links")
})

test("card items keep safe links and complete coordinates only", () => {
  const content = normalizeDestinationContent({
    sections: [{
      id: "places",
      type: "place_links",
      title: "Places you can book from",
      fields: { listHeading: "From places like:" },
      items: [
        { id: "reading", title: " Reading ", address: "Reading, UK", latitude: 51.45, longitude: -0.97, linkHref: "/destinations/reading-taxi", linkLabel: "Reading taxi guide" },
        { id: "oxford", title: "Oxford", latitude: 51.75, linkHref: "javascript:alert(1)" },
        { id: "anchor", title: "Family", icon: "family", linkHref: "#vehicles" },
        { id: "bad-icon", title: "Unknown", icon: "rocket", latitude: Number.NaN, longitude: 1 },
        "not a card",
      ],
    }],
  }, "Exeter Airport Taxi")

  const items = content.sections.find((section) => section.id === "places")!.items!
  expect(items).toHaveLength(4)
  expect(items[0]).toMatchObject({ title: "Reading", latitude: 51.45, longitude: -0.97, linkHref: "/destinations/reading-taxi" })
  expect(items[1].linkHref).toBe("")
  expect(items[1].latitude).toBeUndefined()
  expect(items[2].linkHref).toBe("#vehicles")
  expect(items[3].icon).toBe("")
  expect(items[3].latitude).toBeUndefined()
})

test("card items survive publishing", () => {
  const draft = createDefaultDestinationContent("Exeter Airport Taxi")
  const places = draft.sections.find((section) => section.type === "place_links")!
  places.items = [{ id: "exeter", title: "Exeter", text: "", icon: "", address: "Exeter, UK", latitude: 50.72, longitude: -3.53, linkHref: "", linkLabel: "" }]

  const published = publishedContentFromSnapshot({ h1: "Exeter Airport Taxi", content: draft })
  expect(published.sections?.find((section) => section.type === "place_links")?.items).toEqual(places.items)
  expect(published.sections?.find((section) => section.type === "traveller_types")?.items).toHaveLength(4)
})
