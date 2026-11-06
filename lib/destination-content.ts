import { getDestinationPagePolicy, type DestinationPageType } from "@/lib/destination-page-policy"

export const DESTINATION_CONTENT_SCHEMA_VERSION = 3

export const DESTINATION_SECTION_TYPES = [
  "introduction",
  "benefits",
  "reviews",
  "fleet_pricing",
  "airport_routes",
  "place_coverage",
  "airport_guide",
  "city_routes",
  "place_links",
  "traveller_types",
  "ferry_cruise",
  "travel_information",
  "faq",
  "video",
  "map",
  "related_destinations",
] as const

export type DestinationSectionType = (typeof DESTINATION_SECTION_TYPES)[number]

export type RichTextBlock = {
  type: "heading" | "paragraph" | "bold" | "list" | "link"
  text: string
  href?: string
  label?: string
  listStyle?: "bullet" | "ordered"
}

export type TiptapNode = {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  content?: TiptapNode[]
}

export type TiptapDocument = { type: "doc"; content: TiptapNode[] }

/**
 * A card in a card-list section. "Who we drive" cards use the icon, text and link; "Places you can
 * book from" cards use the title, the Google Places address and coordinates, and an optional page link.
 */
export type DestinationSectionItem = {
  id: string
  title: string
  text: string
  icon: string
  address: string
  latitude?: number
  longitude?: number
  linkHref: string
  linkLabel: string
}

export const TRAVELLER_CARD_ICONS = { family: "Family", business: "Business", group: "Group", long_distance: "Long distance", accessible: "Accessible", luggage: "Luggage" } as const

export type DestinationSection = {
  id: string
  type: DestinationSectionType
  visible: boolean
  required: boolean
  title: string
  body: RichTextBlock[]
  bodyDocument?: TiptapDocument
  fields: Record<string, string>
  items?: DestinationSectionItem[]
  image?: DestinationImageReference
  sourceNotes: SourceNote[]
}

export type SourceNote = { sourceName: string; sourceUrl: string; checkedDate: string }

export type DestinationImageReference = {
  assetId: string
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  altText: string
}

export type DestinationContentDocument = {
  schemaVersion: number
  hero: { heading: string; body: RichTextBlock[]; bodyDocument?: TiptapDocument; image?: DestinationImageReference }
  sections: DestinationSection[]
  finalCta: { heading: string; body: RichTextBlock[]; bodyDocument?: TiptapDocument }
  serviceFacts: import("@/lib/reusable-content").ServiceFact[]
  globalFaqs: import("@/lib/reusable-content").GlobalFaq[]
  airportFaqs: import("@/lib/reusable-content").GlobalFaq[]
  placeFaqs: import("@/lib/reusable-content").GlobalFaq[]
  reviews: import("@/lib/reusable-content").VerifiedReview[]
}

export function isRequiredDestinationSectionType(type: DestinationSectionType, pageType: DestinationPageType = "airport"): boolean {
  return getDestinationPagePolicy(pageType).content.requiredSectionTypes.includes(type)
}

export function isSafeDestinationContentLink(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("/") || value.startsWith("https://"))
}

export const SECTION_LABELS: Record<DestinationSectionType, string> = {
  introduction: "Introduction",
  benefits: "Benefits & service facts",
  reviews: "Verified reviews",
  fleet_pricing: "Fleet & pricing",
  airport_routes: "Airport routes",
  place_coverage: "Coverage & pickup information",
  airport_guide: "Airport Guide",
  city_routes: "Popular city routes",
  place_links: "Places you can book from",
  traveller_types: "Who we drive",
  ferry_cruise: "Ferry & cruise information",
  travel_information: "Travel information",
  faq: "Airport FAQs",
  video: "Approved video",
  map: "Airport map",
  related_destinations: "Related Routes",
}

function sectionLabel(type: DestinationSectionType, pageType: DestinationPageType): string {
  if (pageType !== "place") return SECTION_LABELS[type]
  if (type === "airport_routes") return "Supported Airports"
  if (type === "travel_information") return "Local travel information"
  if (type === "faq") return "Local FAQs"
  if (type === "map") return "Place map"
  if (type === "related_destinations") return "Nearby Places"
  return SECTION_LABELS[type]
}

function makeBlock(text = ""): RichTextBlock[] {
  return text ? [{ type: "paragraph", text }] : []
}

export function createSectionItem(changes: Partial<DestinationSectionItem> = {}): DestinationSectionItem {
  return { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: "", text: "", icon: "", address: "", linkHref: "", linkLabel: "", ...changes }
}

// Starting cards for a new "Who we drive" section; editors adjust them for each airport.
const DEFAULT_TRAVELLER_CARDS: Partial<DestinationSectionItem>[] = [
  { icon: "family", title: "Family Airport Transfers", text: "Travelling with children, pushchairs or a mountain of suitcases? Pick a vehicle with the space to match. You can request a child seat when booking, subject to availability and suitability.", linkHref: "#vehicles", linkLabel: "Compare family vehicles" },
  { icon: "business", title: "Business Airport Transfers", text: "A professional airport taxi for meetings, corporate travel and flight connections. Executive vehicles are there for anyone who wants a more premium journey.", linkHref: "#vehicles", linkLabel: "See executive cars" },
  { icon: "group", title: "Group Airport Transfers", text: "Friends, colleagues or the extended family? Our MPVs and 8-seater minibuses handle larger groups. Check the luggage capacity before you confirm your vehicle.", linkHref: "#vehicles", linkLabel: "See MPVs and minibuses" },
  { icon: "long_distance", title: "Long-Distance Airport Journeys", text: "Arrange a private transfer to destinations across the UK, with the fare agreed up front.", linkHref: "#airport-destinations", linkLabel: "Popular journeys" },
]

// Starting steps for the pickup guide on a new Airport Page; editors adjust them for each airport.
const DEFAULT_PICKUP_STEPS: Partial<DestinationSectionItem>[] = [
  { title: "Share your flight and arrival details", text: "Add your flight number and arrival information when you book so we know when to expect you." },
  { title: "Follow the arrival signs", text: "After landing, follow the signs for passport control and baggage reclaim, then head for arrivals. Your booking confirmation has your driver meeting instructions." },
  { title: "Meet your driver", text: "If you’ve chosen Meet and Greet, your driver waits inside arrivals at the agreed point. If not, follow the pickup instructions in your confirmation." },
  { title: "Head to your destination", text: "From there it’s a straight run to your home, hotel, office or wherever else in the UK you’re heading." },
]

const DEFAULT_PORT_NOTE = "For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers and how much luggage you have. It helps us plan the right vehicle and pickup."

function defaultSectionContent(type: DestinationSectionType, pageType: DestinationPageType): Pick<DestinationSection, "body" | "fields" | "items"> {
  // Airport Pages show ports as cards; a Ferry & cruise section without `items` keeps the older text layout.
  if (type === "ferry_cruise" && pageType === "airport") return { body: [], fields: { note: DEFAULT_PORT_NOTE }, items: [] }
  if (type === "airport_guide") return { body: [], fields: { overview: "", terminals: "", pickup: "", meetingPoints: "", waiting: "", accessibility: "", hotels: "", food: "", officialLink: "", sourceNotes: "" } }
  if (type === "traveller_types") return { body: makeBlock("Different trips need different things. We offer vehicle options and pre-booked journeys to cover them all."), fields: {}, items: DEFAULT_TRAVELLER_CARDS.map((card, index) => createSectionItem({ ...card, id: `traveller-${index + 1}` })) }
  if (type === "place_links") return { body: [], fields: { listHeading: "", closing: "", cta: "" }, items: [] }
  // The Airport map section is the "Know before you land" pickup guide; one without `items` keeps the older layout.
  if (type === "map" && pageType === "airport") return { body: [], fields: { stepsHeading: "", dropHeading: "", dropText: "" }, items: DEFAULT_PICKUP_STEPS.map((step, index) => createSectionItem({ ...step, id: `pickup-step-${index + 1}` })) }
  return { body: [], fields: {} }
}

export function createDestinationSection(type: DestinationSectionType, id = `${type}-${Date.now()}`, pageType: DestinationPageType = "airport"): DestinationSection {
  return {
    id,
    type,
    visible: true,
    required: isRequiredDestinationSectionType(type, pageType),
    title: sectionLabel(type, pageType),
    ...defaultSectionContent(type, pageType),
    sourceNotes: [],
  }
}

/** Optional sections every new Airport Page starts with, after the required ones. */
const AIRPORT_STARTER_SECTION_TYPES: DestinationSectionType[] = ["traveller_types", "place_links", "ferry_cruise"]

export function createDefaultDestinationContent(heading: string, pageType: DestinationPageType = "airport"): DestinationContentDocument {
  const policy = getDestinationPagePolicy(pageType)
  return {
    schemaVersion: DESTINATION_CONTENT_SCHEMA_VERSION,
    hero: { heading, body: [] },
    sections: [
      ...policy.content.requiredSectionTypes.map((type) => createDestinationSection(type, `${type}-required`, pageType)),
      ...(pageType === "airport" ? AIRPORT_STARTER_SECTION_TYPES.map((type) => createDestinationSection(type, `${type}-starter`, pageType)) : []),
    ],
    finalCta: { heading: "Ready to book your airport transfer?", body: makeBlock("Get a fixed price for your journey in minutes.") },
    serviceFacts: [], globalFaqs: [], airportFaqs: [], placeFaqs: [], reviews: [],
  }
}

function isSectionType(value: unknown): value is DestinationSectionType {
  return typeof value === "string" && (DESTINATION_SECTION_TYPES as readonly string[]).includes(value)
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function normalizeSectionItems(value: unknown): DestinationSectionItem[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((item, index): DestinationSectionItem[] => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const coordinate = (key: "latitude" | "longitude") => typeof raw[key] === "number" && Number.isFinite(raw[key]) ? raw[key] as number : undefined
    const linkHref = safeText(raw.linkHref).trim()
    const icon = safeText(raw.icon)
    const next: DestinationSectionItem = {
      id: safeText(raw.id).trim() || `item-${index + 1}`,
      title: safeText(raw.title).trim(),
      text: safeText(raw.text).trim(),
      icon: Object.hasOwn(TRAVELLER_CARD_ICONS, icon) ? icon : "",
      address: safeText(raw.address).trim(),
      // Same-page anchors such as #vehicles are allowed alongside internal paths and HTTPS links.
      linkHref: linkHref.startsWith("#") || isSafeDestinationContentLink(linkHref) ? linkHref : "",
      linkLabel: safeText(raw.linkLabel).trim(),
    }
    const latitude = coordinate("latitude")
    const longitude = coordinate("longitude")
    return [latitude !== undefined && longitude !== undefined ? { ...next, latitude, longitude } : next]
  })
}

function normalizeBlocks(value: unknown): RichTextBlock[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): RichTextBlock[] => {
    if (!item || typeof item !== "object") return []
    const block = item as Record<string, unknown>
    const type = block.type
    if (type !== "heading" && type !== "paragraph" && type !== "bold" && type !== "list" && type !== "link") return []
    const text = safeText(block.text).trim()
    if (!text) return []
    if (type !== "link") return [{ type, text, ...(type === "list" && (block.listStyle === "ordered" || block.listStyle === "bullet") ? { listStyle: block.listStyle } : {}) }]
    const href = safeText(block.href).trim()
    const label = safeText(block.label).trim() || text
    if (!isSafeDestinationContentLink(href)) return []
    return [{ type: "link", text, href, label }]
  })
}

function normalizeTiptapNode(value: unknown): TiptapNode | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  const type = raw.type
  if (typeof type !== "string" || !["doc", "paragraph", "heading", "text", "bold", "bulletList", "orderedList", "listItem", "link"].includes(type)) return undefined
  const node: TiptapNode = { type }
  if (type === "text") {
    if (typeof raw.text !== "string") return undefined
    node.text = raw.text
  }
  if (type === "heading") {
    const level = raw.attrs && typeof raw.attrs === "object" && typeof (raw.attrs as Record<string, unknown>).level === "number" ? (raw.attrs as Record<string, unknown>).level as number : 3
    if (level < 1 || level > 6) return undefined
    node.attrs = { level }
  }
  if (type === "link") {
    const href = raw.attrs && typeof raw.attrs === "object" ? (raw.attrs as Record<string, unknown>).href : undefined
    if (!isSafeDestinationContentLink(href)) return undefined
    node.attrs = { href }
  }
  if (Array.isArray(raw.content)) node.content = raw.content.flatMap((child) => { const normalized = normalizeTiptapNode(child); return normalized ? [normalized] : [] })
  if (Array.isArray(raw.marks)) node.marks = raw.marks.flatMap((mark) => { const normalized = normalizeTiptapNode({ ...mark, content: undefined }); return normalized ? [{ type: normalized.type, attrs: normalized.attrs }] : [] }).filter((mark) => mark.type === "bold" || mark.type === "link")
  return node
}

function normalizeTiptapDocument(value: unknown): TiptapDocument | undefined {
  const normalized = normalizeTiptapNode(value)
  return normalized?.type === "doc" ? { type: "doc", content: normalized.content ?? [] } : undefined
}

export function blocksToTiptapDocument(blocks: RichTextBlock[]): TiptapDocument {
  return {
    type: "doc",
    content: blocks.map((block) => {
      const textNode: TiptapNode = { type: "text", text: block.text }
      if (block.type === "heading") return { type: "heading", attrs: { level: 3 }, content: [textNode] }
      if (block.type === "bold") return { type: "paragraph", content: [{ ...textNode, marks: [{ type: "bold" }] }] }
      if (block.type === "link") return { type: "paragraph", content: [{ ...textNode, marks: [{ type: "link", attrs: { href: block.href || "/book" } }] }] }
      if (block.type === "list") return { type: block.listStyle === "ordered" ? "orderedList" : "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [textNode] }] }] }
      return { type: "paragraph", content: [textNode] }
    }),
  }
}

/** Tiptap's attrs have a null prototype, which React can't send to a Server Action: the server gets a reference it can't read, and reading it throws. */
export function toPlainTiptapDocument(document: unknown): TiptapDocument {
  return JSON.parse(JSON.stringify(document)) as TiptapDocument
}

function nodeText(node: TiptapNode): string {
  return node.text ?? (node.content ?? []).map(nodeText).join("")
}

function nodeMarks(node: TiptapNode, type: string) {
  return (node.marks ?? []).filter((mark) => mark.type === type)
}

export function tiptapDocumentToBlocks(document: TiptapDocument): RichTextBlock[] {
  return document.content.flatMap((node): RichTextBlock[] => {
    if (node.type === "heading") return [{ type: "heading" as const, text: nodeText(node) }]
    if (node.type === "bulletList" || node.type === "orderedList") {
      return (node.content ?? []).map((item) => ({ type: "list" as const, text: nodeText(item), listStyle: node.type === "orderedList" ? "ordered" as const : "bullet" as const }))
    }
    if (node.type !== "paragraph") return []
    const text = nodeText(node)
    if (!text.trim()) return []
    const textNodes = (node.content ?? []).filter((item) => item.type === "text")
    const link = textNodes.flatMap((item) => nodeMarks(item, "link")).find((mark) => typeof mark.attrs?.href === "string")
    if (link?.attrs?.href) return [{ type: "link" as const, text, href: link.attrs.href as string, label: text }]
    if (textNodes.length > 0 && textNodes.every((item) => nodeMarks(item, "bold").length > 0)) return [{ type: "bold" as const, text }]
    return [{ type: "paragraph" as const, text }]
  })
}

export function normalizeDestinationContent(value: unknown, fallbackHeading: string, pageType: DestinationPageType = "airport"): DestinationContentDocument {
  const fallback = createDefaultDestinationContent(fallbackHeading, pageType)
  if (!value || typeof value !== "object") return fallback
  const input = value as Record<string, unknown>
  const rawSections = Array.isArray(input.sections) ? input.sections : []
  const sections: DestinationSection[] = rawSections.flatMap((item, index) => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    if (!isSectionType(raw.type)) return []
    const sectionType = raw.type
    return [{
      id: safeText(raw.id).trim() || `${sectionType}-${index + 1}`,
      type: sectionType,
      visible: raw.visible !== false,
      required: isRequiredDestinationSectionType(sectionType, pageType),
      title: safeText(raw.title).trim() || SECTION_LABELS[sectionType],
      body: normalizeBlocks(raw.body),
      bodyDocument: normalizeTiptapDocument(raw.bodyDocument),
      fields: raw.fields && typeof raw.fields === "object" ? Object.fromEntries(Object.entries(raw.fields).map(([key, field]) => [key, safeText(field)])) : {},
      ...(Array.isArray(raw.items) ? { items: normalizeSectionItems(raw.items) } : {}),
      image: raw.image && typeof raw.image === "object" ? normalizeImageReference(raw.image) : undefined,
      sourceNotes: Array.isArray(raw.sourceNotes) ? raw.sourceNotes.flatMap((item) => {
        if (!item || typeof item !== "object") return []
        const note = item as Record<string, unknown>
        const sourceName = safeText(note.sourceName).trim()
        const sourceUrl = safeText(note.sourceUrl).trim()
        const checkedDate = safeText(note.checkedDate).trim()
        return sourceName || sourceUrl || checkedDate ? [{ sourceName, sourceUrl, checkedDate }] : []
      }) : [],
    }]
  })
  const byType = new Set(sections.map((section) => section.type))
  const legacyIntro = Array.isArray(input.intro) ? input.intro.filter((item): item is string => typeof item === "string") : []
  const legacyBenefits = Array.isArray(input.benefits) ? input.benefits.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const benefit = item as Record<string, unknown>
    const title = safeText(benefit.title).trim()
    const description = safeText(benefit.description).trim()
    return title || description ? [`${title}${title && description ? ": " : ""}${description}`] : []
  }) : []
  const legacyFaqs = Array.isArray(input.faqs) ? input.faqs.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const faq = item as Record<string, unknown>
    const question = safeText(faq.question).trim()
    const answer = safeText(faq.answer).trim()
    return question || answer ? [`${question}${question && answer ? "\n" : ""}${answer}`] : []
  }) : []
  const legacyContent = (type: DestinationSectionType, texts: string[]) => {
    if (!texts.length || byType.has(type)) return
    sections.push({ ...createDestinationSection(type, `${type}-legacy`, pageType), body: texts.map((text) => ({ type: "paragraph" as const, text })) })
    byType.add(type)
  }
  legacyContent("introduction", legacyIntro)
  legacyContent("benefits", legacyBenefits)
  legacyContent("faq", legacyFaqs)
  for (const requiredType of getDestinationPagePolicy(pageType).content.requiredSectionTypes) {
    if (!byType.has(requiredType)) sections.push(createDestinationSection(requiredType, `${requiredType}-required`, pageType))
  }
  const hero = input.hero && typeof input.hero === "object" ? input.hero as Record<string, unknown> : {}
  const finalCta = input.finalCta && typeof input.finalCta === "object" ? input.finalCta as Record<string, unknown> : {}
  return {
    schemaVersion: DESTINATION_CONTENT_SCHEMA_VERSION,
    hero: { heading: safeText(hero.heading).trim() || fallback.hero.heading, body: normalizeBlocks(hero.body), bodyDocument: normalizeTiptapDocument(hero.bodyDocument), image: hero.image && typeof hero.image === "object" ? normalizeImageReference(hero.image) : undefined },
    sections,
    finalCta: { heading: safeText(finalCta.heading).trim() || fallback.finalCta.heading, body: normalizeBlocks(finalCta.body), bodyDocument: normalizeTiptapDocument(finalCta.bodyDocument) },
    serviceFacts: normalizeReusableItems(input.serviceFacts, "fact"),
    globalFaqs: normalizeReusableItems(input.globalFaqs, "faq"),
    // Airport FAQs are centrally managed now. Keep the field for backwards-compatible
    // snapshots, but do not carry page-specific airport FAQs forward.
    airportFaqs: pageType === "airport" ? [] : normalizeReusableItems(input.airportFaqs, "faq"),
    placeFaqs: normalizeReusableItems(input.placeFaqs, "faq"),
    reviews: normalizeReusableItems(input.reviews, "review"),
  }
}

function normalizeReusableItems<T extends Record<string, unknown>>(value: unknown, kind: "fact" | "faq" | "review"): T[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is T => {
    if (!item || typeof item !== "object") return false
    const record = item as Record<string, unknown>
    if (typeof record.id !== "string") return false
    if (kind === "fact") return typeof record.key === "string" && typeof record.title === "string" && typeof record.description === "string"
    if (kind === "faq") return typeof record.question === "string" && typeof record.answer === "string"
    return typeof record.quote === "string" && typeof record.author === "string" && typeof record.source === "string"
  })
}

function normalizeImageReference(value: object): DestinationImageReference | undefined {
  const image = value as Record<string, unknown>
  if ([image.assetId, image.publicId, image.secureUrl, image.altText].some((item) => typeof item !== "string" || !item.trim()) || typeof image.width !== "number" || typeof image.height !== "number" || typeof image.format !== "string") return undefined
  if (typeof image.secureUrl !== "string" || !image.secureUrl.startsWith("https://")) return undefined
  return { assetId: image.assetId as string, publicId: image.publicId as string, secureUrl: image.secureUrl as string, width: image.width as number, height: image.height as number, format: image.format as string, altText: image.altText as string }
}

export function validateDestinationContent(value: unknown, fallbackHeading: string, pageType: DestinationPageType = "airport"): string | null {
  const content = normalizeDestinationContent(value, fallbackHeading, pageType)
  if (!content.hero.heading.trim()) return "Hero heading is required."
  if (!content.finalCta.heading.trim()) return "Final booking CTA heading is required."
  const ids = new Set<string>()
  for (const section of content.sections) {
    if (ids.has(section.id)) return "Each content section needs a unique identifier."
    ids.add(section.id)
    if (section.required && !section.visible) return `${SECTION_LABELS[section.type]} is required and cannot be hidden.`
    for (const note of section.sourceNotes) {
      if (!note.sourceName || !note.sourceUrl || !note.checkedDate) return "Every Source Note needs a source name, HTTPS URL, and checked date."
      if (!note.sourceUrl.startsWith("https://") || !/^\d{4}-\d{2}-\d{2}$/.test(note.checkedDate)) return "Every Source Note needs a source name, HTTPS URL, and checked date."
    }
    for (const block of section.body) {
      if (block.type === "link" && block.href && !block.href.startsWith("/") && !block.href.startsWith("https://")) return "Links must use a known internal path or HTTPS."
    }
  }
  return null
}
