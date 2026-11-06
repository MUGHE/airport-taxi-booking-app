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
  const ports = content.sections.find((section) => section.type === "ferry_cruise")
  expect(ports?.required).toBe(false)
  expect(ports?.items).toEqual([])
  expect(ports?.fields.note).toContain("sailing time")
  expect(validateDestinationContent(content, "Exeter Airport Taxi")).toBeNull()
})

test("a new Airport Page's map section starts as the pickup guide with four steps", () => {
  const map = createDefaultDestinationContent("Exeter Airport Taxi").sections.find((section) => section.type === "map")
  expect(map?.required).toBe(true)
  expect(map?.items?.map((item) => item.title)).toEqual(["Share your flight and arrival details", "Follow the arrival signs", "Meet your driver", "Head to your destination"])
  expect(map?.fields).toEqual({ stepsHeading: "", dropHeading: "", dropText: "" })
})

test("an older map section without steps keeps its layout, and Place Pages get no steps", () => {
  const content = normalizeDestinationContent({ sections: [{ id: "map", type: "map", title: "Airport map", body: [] }] }, "Gatwick Airport Taxi")
  expect(content.sections.find((section) => section.id === "map")?.items).toBeUndefined()
  const placeMap = createDefaultDestinationContent("Reading Airport Taxi", "place").sections.find((section) => section.type === "map")
  expect(placeMap?.items).toBeUndefined()
})

test("pickup steps survive publishing", () => {
  const draft = createDefaultDestinationContent("Exeter Airport Taxi")
  const map = draft.sections.find((section) => section.type === "map")!
  map.fields = { stepsHeading: "How your Exeter pickup works", dropHeading: "", dropText: "" }
  const published = publishedContentFromSnapshot({ h1: "Exeter Airport Taxi", content: draft })
  const publishedMap = published.sections?.find((section) => section.type === "map")
  expect(publishedMap?.items).toHaveLength(4)
  expect(publishedMap?.fields?.stepsHeading).toBe("How your Exeter pickup works")
})

test("an older Ferry & cruise section without cards keeps its text layout", () => {
  const content = normalizeDestinationContent({ sections: [{ id: "ferry", type: "ferry_cruise", title: "Ferry & cruise information", body: [{ type: "paragraph", text: "Ports text." }] }] }, "Gatwick Airport Taxi")
  expect(content.sections.find((section) => section.id === "ferry")?.items).toBeUndefined()
})

test("Place Pages don't get the airport card sections", () => {
  const types = createDefaultDestinationContent("Reading Airport Taxi", "place").sections.map((section) => section.type)
  expect(types).not.toContain("traveller_types")
  expect(types).not.toContain("place_links")
  expect(types).not.toContain("ferry_cruise")
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
