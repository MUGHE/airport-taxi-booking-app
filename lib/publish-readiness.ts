import { SECTION_LABELS, type DestinationContentDocument, type DestinationImageReference } from "@/lib/destination-content"
import type { AdminRelatedDestination, AdminTerminal } from "@/lib/admin-destination-pages"

export type PublishReadinessInput = {
  pageType?: "airport" | "place"
  id?: string
  slug: string
  officialName: string
  displayName: string
  iataCode?: string
  serviceArea?: string
  placeType?: string
  placeGroupId?: string
  primaryParentId?: string
  aliases?: string[]
  coveredLocalities?: { name: string; localityType: string }[]
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
  validNearbyCandidateCount?: number
  googlePlaceReviewStatus?: "valid" | "invalid" | "unreviewed"
}

export type PublishBlocker = { code: string; message: string }
export type PublishWarning = { code: string; message: string; reason: string }
export type ExistingQualityPage = {
  id: string
  slug: string
  pageType?: "airport" | "place"
  iataCode?: string
  displayName?: string
  officialName?: string
  aliases?: string[]
  coveredLocalities?: string[]
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

  if (input.pageType === "place") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim()) || input.slug.trim().endsWith("-airport-taxi")) block("invalid-slug", "Use a short lowercase Place Slug with words separated by hyphens.")
    const identity = [input.displayName, input.officialName, ...(input.aliases ?? []), ...(input.coveredLocalities ?? []).map((item) => item.name)].map((value) => value.trim().toLowerCase()).filter(Boolean)
    const duplicateIdentity = identity.find((value, index) => identity.indexOf(value) !== index)
    const duplicatePage = input.existingPages?.find((page) => page.id !== input.id && page.pageType === "place" && [page.displayName, page.officialName, ...(page.aliases ?? []), ...(page.coveredLocalities ?? [])].some((value) => value?.trim().toLowerCase() && identity.includes(value.trim().toLowerCase())))
    if (duplicateIdentity || duplicatePage) block("duplicate-identity", "The Place name, alias, or Covered Locality conflicts with another active Place.")
    if (!hasText(input.officialName) || !hasText(input.displayName) || !hasText(input.placeType) || !hasText(input.placeGroupId)) block("incomplete-identity", "Official name, display name, Place type, and Place Group are required.")
    if (input.primaryParentId === input.id) block("invalid-parent", "A Place cannot be its own Primary Parent.")
    if (!hasText(input.googlePlaceId) || !hasText(input.address) || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) block("incomplete-location", "A confirmed Google Place, address, and valid coordinates are required.")
    if (input.googlePlaceReviewStatus && input.googlePlaceReviewStatus !== "valid") block("unreviewed-google-place", "Review the selected Google Place again before publishing.")
    if (!hasText(input.seoTitle)) block("missing-seo-title", "An SEO title is required.")
    if (!hasText(input.metaDescription)) block("missing-meta-description", "A meta description is required.")
    if (!hasText(input.h1)) block("missing-h1", "An H1 heading is required.")
    if (!hasText(input.content.hero.heading) || !input.content.hero.body.some((item) => hasText(item.text))) block("missing-hero", "The hero needs a heading and introduction.")
    if (!hasText(input.content.finalCta.heading) || !input.content.finalCta.body.some((item) => hasText(item.text))) block("missing-final-cta", "The final booking CTA needs a heading and description.")
    const required = ["introduction", "airport_routes", "place_coverage", "travel_information", "faq"] as const
    const sections = new Map(input.content.sections.map((section) => [section.type, section]))
    for (const type of required) {
      const section = sections.get(type)
      if (!section || !section.visible || !hasContent(section)) block(`missing-${type}`, `${SECTION_LABELS[type]} is required and must contain content.`)
    }
    if (input.content.placeFaqs.filter((faq) => hasText(faq.question) && hasText(faq.answer)).length < 2) block("minimum-faqs", "At least two local FAQs with questions and answers are required.")
    const supported = input.relatedDestinations.filter((item) => item.kind === "supported_airport")
    if (!supported.length) block("missing-supported-airport", "Select at least one Supported Airport.")
    if (!supported.some((item) => item.bookingAvailable !== false)) block("no-bookable-airport", "At least one Supported Airport must currently accept bookings.")
    if (input.relatedDestinations.some((item) => item.kind === "supported_airport" && (!item.pageId || item.bookingAvailable === undefined))) block("invalid-relationships", "Every Supported Airport must be a Published Airport Page.")
    if (input.relatedDestinations.some((item) => item.kind === "nearby_place" && (!item.pageId || item.pageId === input.id))) block("invalid-relationships", "Every Nearby Place must be a different Published Place Page.")
    const images = [input.content.hero.image, ...input.content.sections.map((section) => section.image)].filter(Boolean)
    if (images.some((image) => !imageIsComplete(image))) block("invalid-media", "Every used image needs a verified HTTPS asset and alternative text.")
    for (const section of input.content.sections) for (const link of section.body.filter((item) => item.type === "link")) {
      if (!link.href || (!link.href.startsWith("/") && !link.href.startsWith("https://"))) block("unsafe-link", "Links must use a known internal path or HTTPS.")
      if (link.href?.startsWith("https://") && !hasText(link.label)) block("missing-link-label", "External links need a visible label.")
      if (link.href?.startsWith("/") && !SAFE_INTERNAL_PATHS.has(link.href)) block("broken-internal-link", `The internal link ${link.href} is not a known site path.`)
    }
    return blockers
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/.test(input.slug.trim())) block("invalid-slug", "Use a lowercase Airport Slug ending in -airport-taxi.")
  const duplicate = input.existingPages?.find((page) => page.id !== input.id && (page.slug === input.slug || page.iataCode === input.iataCode || (page.seoTitle && page.seoTitle.toLowerCase() === input.seoTitle.trim().toLowerCase())))
  if (duplicate) block("duplicate-value", `The Airport Slug, IATA code, or SEO title conflicts with ${duplicate.slug}.`)
  if (!hasText(input.officialName) || !hasText(input.displayName) || !/^[A-Z]{3}$/.test((input.iataCode ?? "").trim())) block("incomplete-identity", "Official name, display name, and a three-letter IATA code are required.")
  if (!hasText(input.serviceArea)) block("missing-service-area", "A service area is required.")
  if (!hasText(input.googlePlaceId) || !hasText(input.address) || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) block("incomplete-location", "A Google Place, address, latitude, and longitude are required.")
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
      if (link.href?.startsWith("/") && !SAFE_INTERNAL_PATHS.has(link.href)) block("broken-internal-link", `The internal link ${link.href} is not a known site path. Choose a Related Route for another Airport Page.`)
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

function isOlderThanTwelveMonths(checkedDate: string, now = new Date()): boolean {
  const parsed = new Date(`${checkedDate}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedDate) || Number.isNaN(parsed.getTime())) return false
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()))
  return parsed < cutoff
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
  if (input.pageType === "place") {
    const staleSource = input.content.sections.some((section) => section.sourceNotes.some((note) => isOlderThanTwelveMonths(note.checkedDate)))
    if (staleSource) warnings.push({
      code: "stale-source-note",
      message: "At least one important Source Note is more than twelve months old.",
      reason: "Older local information may no longer be accurate. Check the source before publishing.",
    })

    const nearbyCount = input.relatedDestinations.filter((item) => item.kind === "nearby_place").length
    if ((input.validNearbyCandidateCount ?? 0) >= 3 && nearbyCount < 3) warnings.push({
      code: "fewer-nearby-places",
      message: "This Place has fewer than three Nearby Places selected.",
      reason: "Nearby Places help visitors discover related areas. Add at least three when enough valid Published Place Pages exist.",
    })

    if (!input.content.hero.image) warnings.push({
      code: "missing-unique-hero-image",
      message: "This Place does not have a unique hero image.",
      reason: "A unique image helps visitors tell this Place Page apart from other pages. You may publish without one.",
    })
  }
  return warnings
}

export function getWarningSetHash(warnings: PublishWarning[]): string {
  const value = warnings.map((warning) => `${warning.code}:${warning.message}:${warning.reason}`).join("|")
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(16)
}
