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

export type DestinationSection = {
  id: string
  type: DestinationSectionType
  visible: boolean
  required: boolean
  title: string
  body: RichTextBlock[]
  bodyDocument?: TiptapDocument
  fields: Record<string, string>
  image?: DestinationImageReference
}

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
  reviews: import("@/lib/reusable-content").VerifiedReview[]
}

const REQUIRED_SECTION_TYPES = new Set<DestinationSectionType>([
  "introduction",
  "benefits",
  "fleet_pricing",
  "airport_guide",
  "faq",
  "map",
])

export function isRequiredDestinationSectionType(type: DestinationSectionType): boolean {
  return REQUIRED_SECTION_TYPES.has(type)
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
  airport_guide: "Airport Guide",
  city_routes: "Popular city routes",
  ferry_cruise: "Ferry & cruise information",
  travel_information: "Travel information",
  faq: "Airport FAQs",
  video: "Approved video",
  map: "Airport map",
  related_destinations: "Related Routes",
}

function makeBlock(text = ""): RichTextBlock[] {
  return text ? [{ type: "paragraph", text }] : []
}

export function createDestinationSection(type: DestinationSectionType, id = `${type}-${Date.now()}`): DestinationSection {
  return {
    id,
    type,
    visible: true,
    required: isRequiredDestinationSectionType(type),
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
    serviceFacts: [], globalFaqs: [], airportFaqs: [], reviews: [],
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

export function normalizeDestinationContent(value: unknown, fallbackHeading: string): DestinationContentDocument {
  const fallback = createDefaultDestinationContent(fallbackHeading)
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
      required: isRequiredDestinationSectionType(sectionType),
      title: safeText(raw.title).trim() || SECTION_LABELS[sectionType],
      body: normalizeBlocks(raw.body),
      bodyDocument: normalizeTiptapDocument(raw.bodyDocument),
      fields: raw.fields && typeof raw.fields === "object" ? Object.fromEntries(Object.entries(raw.fields).map(([key, field]) => [key, safeText(field)])) : {},
      image: raw.image && typeof raw.image === "object" ? normalizeImageReference(raw.image) : undefined,
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
    hero: { heading: safeText(hero.heading).trim() || fallback.hero.heading, body: normalizeBlocks(hero.body), bodyDocument: normalizeTiptapDocument(hero.bodyDocument), image: hero.image && typeof hero.image === "object" ? normalizeImageReference(hero.image) : undefined },
    sections,
    finalCta: { heading: safeText(finalCta.heading).trim() || fallback.finalCta.heading, body: normalizeBlocks(finalCta.body), bodyDocument: normalizeTiptapDocument(finalCta.bodyDocument) },
    serviceFacts: normalizeReusableItems(input.serviceFacts, "fact"),
    globalFaqs: normalizeReusableItems(input.globalFaqs, "faq"),
    airportFaqs: normalizeReusableItems(input.airportFaqs, "faq"),
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
