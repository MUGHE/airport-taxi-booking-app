import { SECTION_LABELS, type DestinationContentDocument, type DestinationImageReference } from "@/lib/destination-content"
import type { AdminRelatedDestination, AdminTerminal } from "@/lib/admin-destination-pages"

export type PublishReadinessInput = {
  id?: string
  slug: string
  officialName: string
  displayName: string
  iataCode: string
  serviceArea: string
  googlePlaceId: string
  address: string
  latitude: number
  longitude: number
  terminals: AdminTerminal[]
  relatedDestinations: AdminRelatedDestination[]
  seoTitle: string
  metaDescription: string
  h1: string
  content: DestinationContentDocument
  existingPages?: ExistingQualityPage[]
}

export type PublishBlocker = { code: string; message: string }
export type PublishWarning = { code: string; message: string; reason: string }
export type ExistingQualityPage = {
  id: string
  slug: string
  iataCode: string
  seoTitle?: string
  metaDescription?: string
  content?: DestinationContentDocument
  heroImageAssetId?: string
}

const REQUIRED_SECTIONS = ["introduction", "benefits", "fleet_pricing", "airport_guide", "map"] as const
const SAFE_INTERNAL_PATHS = new Set(["/", "/book", "/airport-transfers", "/contact", "/help", "/about", "/privacy", "/terms"])

function hasText(value: string | undefined): boolean { return Boolean(value?.trim()) }
function hasContent(section: { body: { text: string }[]; fields: Record<string, string> }): boolean {
  return section.body.some((block) => hasText(block.text)) || Object.values(section.fields).some(hasText)
}
function imageIsComplete(image: DestinationImageReference | undefined): boolean {
  return Boolean(image && image.assetId && image.publicId && image.secureUrl.startsWith("https://") && image.altText.trim())
}

export function getPublishBlockers(input: PublishReadinessInput): PublishBlocker[] {
  const blockers: PublishBlocker[] = []
  const block = (code: string, message: string) => blockers.push({ code, message })

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/.test(input.slug.trim())) block("invalid-slug", "Use a lowercase Airport Slug ending in -airport-taxi.")
  const duplicate = input.existingPages?.find((page) => page.id !== input.id && (page.slug === input.slug || page.iataCode === input.iataCode || (page.seoTitle && page.seoTitle.toLowerCase() === input.seoTitle.trim().toLowerCase())))
  if (duplicate) block("duplicate-value", `The Airport Slug, IATA code, or SEO title conflicts with ${duplicate.slug}.`)
  if (!hasText(input.officialName) || !hasText(input.displayName) || !/^[A-Z]{3}$/.test(input.iataCode.trim())) block("incomplete-identity", "Official name, display name, and a three-letter IATA code are required.")
  if (!hasText(input.serviceArea) || !hasText(input.googlePlaceId) || !hasText(input.address) || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) block("incomplete-location", "A service area, Google Place, address, latitude, and longitude are required.")
  if (!input.terminals.length || input.terminals.some((terminal) => !hasText(terminal.displayName) || !hasText(terminal.address) || !Number.isFinite(terminal.latitude) || !Number.isFinite(terminal.longitude))) block("invalid-terminal", "Every Airport Terminal needs a name, address, and valid coordinates.")
  if (input.terminals.filter((terminal) => terminal.isPrimary).length !== 1) block("missing-primary-terminal", "Exactly one primary Airport Terminal is required.")

  if (!hasText(input.seoTitle)) block("missing-seo-title", "An SEO title is required.")
  if (!hasText(input.metaDescription)) block("missing-meta-description", "A meta description is required.")
  if (!hasText(input.h1)) block("missing-h1", "An H1 heading is required.")
  if (!hasText(input.content.hero.heading) || !input.content.hero.body.some((item) => hasText(item.text)) || !imageIsComplete(input.content.hero.image)) block("missing-hero", "The hero needs a heading, introduction, and verified image with alt text.")
  if (!hasText(input.content.finalCta.heading) || !input.content.finalCta.body.some((item) => hasText(item.text))) block("missing-final-cta", "The final booking CTA needs a heading and description.")

  const sections = new Map(input.content.sections.map((section) => [section.type, section]))
  for (const type of REQUIRED_SECTIONS) {
    const section = sections.get(type)
    if (!section || !section.visible || !hasContent(section)) block(`missing-${type}`, `${SECTION_LABELS[type]} is required and must contain content.`)
  }

  const validFaqs = input.content.airportFaqs.filter((faq) => hasText(faq.question) && hasText(faq.answer))
  if (validFaqs.length < 3) block("minimum-faqs", "At least three airport-specific FAQs with questions and answers are required.")
  if (input.relatedDestinations.length < 3) block("minimum-related-pages", "At least three related Published Pages are required.")
  if (input.relatedDestinations.some((item) => !item.pageId || item.pageId === input.id || !hasText(item.heading) || !hasText(item.description) || !hasText(item.reverseHeading) || !hasText(item.reverseDescription))) block("invalid-relationships", "Every related Published Page needs valid two-way descriptions.")

  const images = [input.content.hero.image, ...input.content.sections.map((section) => section.image)].filter(Boolean)
  if (images.some((image) => !imageIsComplete(image))) block("invalid-media", "Every used image needs a verified HTTPS asset and alternative text.")
  for (const section of input.content.sections) {
    for (const link of section.body.filter((item) => item.type === "link")) {
      if (!link.href || (!link.href.startsWith("/") && !link.href.startsWith("https://"))) block("unsafe-link", "Links must use a known internal path or HTTPS.")
      if (link.href?.startsWith("https://") && !hasText(link.label)) block("missing-link-label", "External links need a visible label.")
      if (link.href?.startsWith("/") && !SAFE_INTERNAL_PATHS.has(link.href) && !link.href.startsWith("/airport-transfers/")) block("broken-internal-link", `The internal link ${link.href} is not a known site path.`)
    }
  }
  return blockers
}

const QUALITY_STOP_WORDS = new Set(["a", "an", "and", "for", "from", "in", "of", "the", "to", "with"])

function words(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((word) => word && !QUALITY_STOP_WORDS.has(word))
}

function similarity(left: string, right: string): number {
  const leftWords = new Set(words(left))
  const rightWords = new Set(words(right))
  if (leftWords.size < 4 || rightWords.size < 4) return 0
  const shared = [...leftWords].filter((word) => rightWords.has(word)).length
  return shared / new Set([...leftWords, ...rightWords]).size
}

function prose(content: DestinationContentDocument): string {
  const blocks = [
    ...content.hero.body,
    ...content.sections.flatMap((section) => section.body),
    ...content.finalCta.body,
  ]
  return blocks.map((block) => block.text).filter((text) => words(text).length >= 4).join(" ")
}

function repeatedWordCount(left: string, right: string): number {
  const leftWords = words(left)
  const rightWords = words(right)
  let longest = 0
  for (let start = 0; start < leftWords.length; start++) {
    for (let otherStart = 0; otherStart < rightWords.length; otherStart++) {
      let length = 0
      while (leftWords[start + length] === rightWords[otherStart + length]) length++
      longest = Math.max(longest, length)
    }
  }
  return longest
}

export function getPublishWarnings(input: PublishReadinessInput): PublishWarning[] {
  const warnings: PublishWarning[] = []
  const otherPages = (input.existingPages ?? []).filter((page) => page.id !== input.id)
  const similarMeta = otherPages.find((page) => page.metaDescription && similarity(input.metaDescription, page.metaDescription) >= 0.65)
  if (similarMeta) warnings.push({
    code: "similar-meta-description",
    message: `The meta description is materially similar to ${similarMeta.slug}.`,
    reason: "Materially similar meta descriptions can make pages look duplicated to visitors and search engines.",
  })

  const currentProse = prose(input.content)
  const repeatedWith = otherPages.find((page) => page.content && repeatedWordCount(currentProse, prose(page.content)) >= 12)
  if (repeatedWith) warnings.push({
    code: "repeated-prose",
    message: `This page repeats substantial prose used by ${repeatedWith.slug}.`,
    reason: "Long repeated prose may mean the page is not sufficiently differentiated.",
  })

  const currentHeroId = input.content.hero.image?.assetId
  const duplicateHero = currentHeroId && otherPages.find((page) => page.heroImageAssetId === currentHeroId)
  if (duplicateHero) warnings.push({
    code: "duplicate-hero-image",
    message: `The selected hero image is already used by ${duplicateHero.slug}.`,
    reason: "Reusing a hero image can make destination pages look less distinctive.",
  })
  return warnings
}

export function getWarningSetHash(warnings: PublishWarning[]): string {
  const value = warnings.map((warning) => `${warning.code}:${warning.message}:${warning.reason}`).join("|")
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(16)
}
