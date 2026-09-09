export const DESTINATION_CONTENT_SCHEMA_VERSION = 1

export const DESTINATION_SECTION_TYPES = [
  "introduction",
  "benefits",
  "reviews",
  "fleet_pricing",
  "airport_routes",
  "airport_guide",
  "city_routes",
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
}

export type DestinationSection = {
  id: string
  type: DestinationSectionType
  visible: boolean
  required: boolean
  title: string
  body: RichTextBlock[]
  fields: Record<string, string>
}

export type DestinationContentDocument = {
  schemaVersion: number
  hero: { heading: string; body: RichTextBlock[] }
  sections: DestinationSection[]
  finalCta: { heading: string; body: RichTextBlock[] }
}

const REQUIRED_SECTION_TYPES = new Set<DestinationSectionType>([
  "introduction",
  "benefits",
  "fleet_pricing",
  "airport_guide",
  "faq",
  "map",
])

export const SECTION_LABELS: Record<DestinationSectionType, string> = {
  introduction: "Introduction",
  benefits: "Benefits & service facts",
  reviews: "Verified reviews",
  fleet_pricing: "Fleet & pricing",
  airport_routes: "Airport routes",
  airport_guide: "Airport Guide",
  city_routes: "Popular city routes",
  ferry_cruise: "Ferry & cruise information",
  travel_information: "Travel information",
  faq: "Airport FAQs",
  video: "Approved video",
  map: "Airport map",
  related_destinations: "Related destinations",
}

function makeBlock(text = ""): RichTextBlock[] {
  return text ? [{ type: "paragraph", text }] : []
}

export function createDestinationSection(type: DestinationSectionType, id = `${type}-${Date.now()}`): DestinationSection {
  return {
    id,
    type,
    visible: true,
    required: REQUIRED_SECTION_TYPES.has(type),
    title: SECTION_LABELS[type],
    body: [],
    fields: type === "airport_guide" ? { overview: "", terminals: "", pickup: "", meetingPoints: "", waiting: "", accessibility: "", hotels: "", food: "", officialLink: "", sourceNotes: "" } : {},
  }
}

export function createDefaultDestinationContent(heading: string): DestinationContentDocument {
  return {
    schemaVersion: DESTINATION_CONTENT_SCHEMA_VERSION,
    hero: { heading, body: [] },
    sections: (["introduction", "benefits", "fleet_pricing", "airport_guide", "faq", "map"] as DestinationSectionType[]).map((type) => createDestinationSection(type, `${type}-required`)),
    finalCta: { heading: "Ready to book your airport transfer?", body: makeBlock("Get a fixed price for your journey in minutes.") },
  }
}

function isSectionType(value: unknown): value is DestinationSectionType {
  return typeof value === "string" && (DESTINATION_SECTION_TYPES as readonly string[]).includes(value)
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value : ""
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
    if (type !== "link") return [{ type, text }]
    const href = safeText(block.href).trim()
    const label = safeText(block.label).trim() || text
    if (!href || (!href.startsWith("/") && !href.startsWith("https://"))) return []
    return [{ type: "link", text, href, label }]
  })
}

export function normalizeDestinationContent(value: unknown, fallbackHeading: string): DestinationContentDocument {
  const fallback = createDefaultDestinationContent(fallbackHeading)
  if (!value || typeof value !== "object") return fallback
  const input = value as Record<string, unknown>
  const rawSections = Array.isArray(input.sections) ? input.sections : []
  const sections = rawSections.flatMap((item, index) => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    if (!isSectionType(raw.type)) return []
    const sectionType = raw.type
    return [{
      id: safeText(raw.id).trim() || `${sectionType}-${index + 1}`,
      type: sectionType,
      visible: raw.visible !== false,
      required: REQUIRED_SECTION_TYPES.has(sectionType),
      title: safeText(raw.title).trim() || SECTION_LABELS[sectionType],
      body: normalizeBlocks(raw.body),
      fields: raw.fields && typeof raw.fields === "object" ? Object.fromEntries(Object.entries(raw.fields).map(([key, field]) => [key, safeText(field)])) : {},
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
    sections.push({ ...createDestinationSection(type, `${type}-legacy`), body: texts.map((text) => ({ type: "paragraph" as const, text })) })
    byType.add(type)
  }
  legacyContent("introduction", legacyIntro)
  legacyContent("benefits", legacyBenefits)
  legacyContent("faq", legacyFaqs)
  for (const requiredType of REQUIRED_SECTION_TYPES) {
    if (!byType.has(requiredType)) sections.push(createDestinationSection(requiredType, `${requiredType}-required`))
  }
  const hero = input.hero && typeof input.hero === "object" ? input.hero as Record<string, unknown> : {}
  const finalCta = input.finalCta && typeof input.finalCta === "object" ? input.finalCta as Record<string, unknown> : {}
  return {
    schemaVersion: DESTINATION_CONTENT_SCHEMA_VERSION,
    hero: { heading: safeText(hero.heading).trim() || fallback.hero.heading, body: normalizeBlocks(hero.body) },
    sections,
    finalCta: { heading: safeText(finalCta.heading).trim() || fallback.finalCta.heading, body: normalizeBlocks(finalCta.body) },
  }
}

export function validateDestinationContent(value: unknown, fallbackHeading: string): string | null {
  const content = normalizeDestinationContent(value, fallbackHeading)
  if (!content.hero.heading.trim()) return "Hero heading is required."
  if (!content.finalCta.heading.trim()) return "Final booking CTA heading is required."
  const ids = new Set<string>()
  for (const section of content.sections) {
    if (ids.has(section.id)) return "Each content section needs a unique identifier."
    ids.add(section.id)
    if (section.required && !section.visible) return `${SECTION_LABELS[section.type]} is required and cannot be hidden.`
    for (const block of section.body) {
      if (block.type === "link" && block.href && !block.href.startsWith("/") && !block.href.startsWith("https://")) return "Links must use a known internal path or HTTPS."
    }
  }
  return null
}
