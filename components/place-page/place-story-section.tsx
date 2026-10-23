import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Car, Check, Luggage, MapPin, PlaneTakeoff, Ship } from "lucide-react"
import { LeadAndMore, TiptapRichText } from "@/components/airport-page/airport-page-renderer"
import { ResilientImage } from "@/components/airport-page/resilient-image"
import { Button } from "@/components/ui/button"
import type { DestinationSection, RichTextBlock } from "@/lib/destination-content"
import type { PlacePagePresentation } from "@/lib/place-page-data"

// Destination sections are long CMS copy with no images of their own, so each one gets a partner on
// the right that fits its subject: a photo, the airports served, or a short checklist.

const LONG_SECTION_WORDS = 200

const PHOTOS = {
  chauffeur: { src: "/hero-airport-transfer.webp", alt: "A chauffeur opening the door of an executive car" },
  terminal: { src: "/airport-transfers/chauffeur-terminal-hero.webp", alt: "A chauffeur waiting beside an executive car outside an airport terminal" },
  wing: { src: "/airport-transfers/hero.webp", alt: "An aircraft wing above the clouds at sunset" },
}

/** CMS template titles that tell visitors nothing are swapped for a heading about the place. */
// Template titles, and the "Bath Taxi For Airport Transfer" style keyword titles, read as short
// sentence-case headings that still name the place. The CMS text itself is left untouched.
const HEADING_REWRITES: [RegExp, (place: string) => string][] = [
  [/^introduction$/i, (place) => `${place} airport transfers`],
  [/^supported airports$/i, (place) => `Airport transfers from ${place}`],
  [/^coverage & pickup information$/i, (place) => `Coverage & pickups in ${place}`],
  [/^local travel information$/i, (place) => `Getting around ${place}`],
  [/^local faqs$/i, (place) => `Local questions about ${place}`],
  [/^ferry & cruise information$/i, (place) => `${place} to ferry & cruise terminals`],
  [/taxi for airport transfers?$/i, (place) => `Airport taxis from ${place}`],
  [/taxi service to nationwide$/i, (place) => `Nationwide taxis from ${place}`],
  [/taxi to uk ferry\s*-\s*cruise terminals$/i, (place) => `${place} to UK ferry & cruise terminals`],
]

function sectionHeading(section: DestinationSection, placeName: string) {
  const title = section.title.trim()
  const rewrite = HEADING_REWRITES.find(([pattern]) => pattern.test(title))
  return rewrite ? rewrite[1](placeName) : title
}

/** "Southampton Taxi" -> "Southampton": CMS display names often end in the service name. */
function placeName(page: PlacePagePresentation) {
  return page.displayName.replace(/\s+taxi$/i, "")
}

function wordCount(section: DestinationSection) {
  return section.body.map((block) => block.text).join(" ").split(/\s+/).filter(Boolean).length
}

function Body({ section }: { section: DestinationSection }) {
  if (wordCount(section) > LONG_SECTION_WORDS) {
    return <LeadAndMore blocks={section.body} document={section.bodyDocument} moreLabel="Read more" />
  }
  if (section.bodyDocument) return <TiptapRichText document={section.bodyDocument} />
  return <PlainBlocks blocks={section.body} />
}

function PlainBlocks({ blocks }: { blocks: RichTextBlock[] }) {
  return <div className="space-y-4 text-left text-muted-foreground">{blocks.map((block, index) => <p key={index} className={block.type === "bold" ? "font-semibold text-foreground" : "leading-7"}>{block.text}</p>)}</div>
}

function Photo({ photo }: { photo: { src: string; alt: string } }) {
  return (
    <div className="place-story-photo">
      <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 900px) 40vw, 100vw" className="object-cover" />
    </div>
  )
}

function Checklist({ icon: Icon, title, points, page }: { icon: typeof MapPin; title: string; points: string[]; page: PlacePagePresentation }) {
  return (
    <div className="place-story-card">
      <span className="place-story-card-icon"><Icon aria-hidden="true" /></span>
      <h3>{title}</h3>
      <ul>{points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
      <Button className="mt-2" nativeButton={false} render={<Link href="/book" />}>Get My Fixed Price <ArrowRight className="size-4" /></Button>
      <p className="place-story-card-note">Fixed fare for your {placeName(page)} pickup, confirmed before you pay.</p>
    </div>
  )
}

function AirportLinks({ page }: { page: PlacePagePresentation }) {
  if (page.supportedAirports.length === 0) return <Photo photo={PHOTOS.wing} />
  return (
    <div className="place-story-card">
      <span className="place-story-card-icon"><PlaneTakeoff aria-hidden="true" /></span>
      <h3>Airports we cover from {placeName(page)}</h3>
      <ul className="place-story-airports">
        {page.supportedAirports.map((airport) => (
          <li key={airport.id}><Link href={`/airport-transfers/${airport.slug}`}>{airport.displayName}<ArrowRight aria-hidden="true" /></Link></li>
        ))}
      </ul>
      <p className="place-story-card-note">Flights tracked, with 60 minutes free waiting on airport arrivals.</p>
    </div>
  )
}

function CruisePanel({ page }: { page: PlacePagePresentation }) {
  return (
    <aside className="airport-cruise-panel">
      <span className="airport-cruise-icon"><Ship aria-hidden="true" /></span>
      <h3>Your sailing time sets the pickup.</h3>
      <p>Tell us your port and boarding time and we&apos;ll plan the journey from {placeName(page)} around it.</p>
      <p className="airport-cruise-tip"><Luggage aria-hidden="true" />Travelling with cruise luggage? An Estate Car or MPV gives you room for it.</p>
      <Button nativeButton={false} render={<Link href="/book" />}>Get My Fixed Price <ArrowRight className="size-4" /></Button>
    </aside>
  )
}

function Partner({ section, page }: { section: DestinationSection; page: PlacePagePresentation }) {
  if (section.image) return <div className="place-story-photo"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} sizes="(min-width: 900px) 40vw, 100vw" /></div>
  switch (section.type) {
    case "introduction":
      return <Photo photo={PHOTOS.chauffeur} />
    case "place_coverage":
      return <Checklist icon={MapPin} title={`Pickups across ${placeName(page)}`} points={["Collected from your exact address", "Homes, hotels, offices and stations", "Child seats on request", "Meet & greet available at the airport"]} page={page} />
    case "airport_routes":
      return <AirportLinks page={page} />
    case "ferry_cruise":
      return <CruisePanel page={page} />
    case "faq":
      return <Checklist icon={Car} title="Long-distance transfers" points={["One fixed price for the whole journey", "Saloon cars to 8-seater minibuses", "Professional, licensed drivers", "Book online at any time"]} page={page} />
    case "travel_information":
      return <Photo photo={PHOTOS.terminal} />
    default:
      return <Photo photo={PHOTOS.wing} />
  }
}

export function PlaceStorySection({ section, page, index }: { section: DestinationSection; page: PlacePagePresentation; index: number }) {
  return (
    <section className={`place-story ${index % 2 === 1 ? "place-story-reversed" : ""}`} data-preview-section={section.type}>
      <div className="airport-container place-story-grid">
        <div className="place-story-copy">
          <h2>{sectionHeading(section, placeName(page))}</h2>
          <div className="mt-5"><Body section={section} /></div>
        </div>
        <div className="place-story-aside"><Partner section={section} page={page} /></div>
      </div>
    </section>
  )
}
