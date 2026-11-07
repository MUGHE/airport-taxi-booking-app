import Link from "next/link"
import { ArrowRight, Building2, Car, Info, MapPin, PlaneLanding, Ship, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createAirportBookingLinks, createRouteBookingLinks, type AirportPagePresentation } from "@/lib/airport-page-data"

// Card sections for airport pages built from a client content brief (see airport-briefs.tsx). Every
// card can carry booking buttons that open /book with the route already filled in.

export type BriefPlace = {
  /** Short name for button labels, e.g. "Gatwick". */
  label: string
  /** Name in the card title, e.g. "Gatwick Airport". */
  name: string
  /** Address the booking form shows. */
  address: string
  latitude: number
  longitude: number
  text?: string
  /** A site page about this place, linked from its card. */
  href?: string
  hrefLabel?: string
}

/** A booking button: "to" ends at the airport (or terminal), "from" starts there. */
export type BriefAction = { kind: "to" | "from"; label: string; terminal?: string }

export type BriefCard = {
  icon?: LucideIcon
  /** Short text in a filled circle instead of an icon, e.g. "T2". */
  badge?: string
  title: string
  text: React.ReactNode
  actions?: BriefAction[]
  link?: { href: string; label: string }
  highlight?: boolean
}

export type AirportBrief = {
  guide: { heading: string; paragraphs: React.ReactNode[]; groups: { title: string; columns: 2 | 3 | 4; cards: BriefCard[] }[] }
  departures: { eyebrow: string; heading: string; paragraphs: React.ReactNode[]; cards: BriefCard[] }
  travellers: { heading: string; lead: string; cards: BriefCard[] }
  cities?: { eyebrow?: string; heading: string; paragraphs: React.ReactNode[]; listHeading: string; places: BriefPlace[]; closing: string; cta: string }
  /** `origin` starts the booking buttons somewhere other than the airport itself. */
  airports: { heading: string; paragraphs: React.ReactNode[]; titleFrom: string; places: BriefPlace[]; closing?: string; origin?: BriefPlace }
  ports?: { heading: string; paragraphs: React.ReactNode[]; titleFrom: string; places: BriefPlace[]; note: string }
}

export type BriefPricing = { heading: string; paragraphs: string[]; cta: string }

/** Anchors other copy on the page links to. */
export const BRIEF_GUIDE_ID = "airport-travel-guide"
export const BRIEF_DESTINATIONS_ID = "airport-destinations"

function primaryTerminal(page: AirportPagePresentation) {
  return page.terminals.find((terminal) => terminal.isPrimary) ?? page.terminals[0]
}

/** `toAirport` is airport -> place, `fromAirport` is place -> airport. */
function placeLinks(page: AirportPagePresentation, place: BriefPlace, origin?: BriefPlace) {
  const airport = origin ? { name: origin.address, latitude: origin.latitude, longitude: origin.longitude } : primaryTerminal(page)
  if (!airport) return page.bookingLinks
  return createRouteBookingLinks(airport, { name: place.address, latitude: place.latitude, longitude: place.longitude })
}

function actionHref(page: AirportPagePresentation, action: BriefAction) {
  const terminal = action.terminal ? page.terminals.find((item) => item.name.toLowerCase().endsWith(action.terminal!.toLowerCase())) : undefined
  const links = terminal ? createAirportBookingLinks(terminal) : page.bookingLinks
  return action.kind === "to" ? links.toAirport : links.fromAirport
}

/** `body` is CMS rich text, which brings its own paragraphs. */
function SectionHeading({ eyebrow, title, paragraphs, body }: { eyebrow: string; title: string; paragraphs: React.ReactNode[]; body?: React.ReactNode }) {
  return <div className="airport-travel-info-intro"><p className="airport-eyebrow">{eyebrow}</p><h2>{title}</h2>{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}{body}</div>
}

function Buttons({ buttons }: { buttons: { href: string; label: string }[] }) {
  return (
    <div className="airport-card-actions">
      {buttons.map((button, index) => <Button key={`${index}-${button.label}`} size="sm" variant={index === 0 ? "default" : "outline"} nativeButton={false} render={<Link href={button.href} />}>{button.label}{index === 0 && <ArrowRight aria-hidden="true" />}</Button>)}
    </div>
  )
}

function CardGrid({ page, cards, columns, className = "airport-link-card" }: { page: AirportPagePresentation; cards: BriefCard[]; columns: 2 | 3 | 4; className?: string }) {
  return (
    <div className={`airport-card-grid airport-card-grid-${columns}`}>
      {cards.map(({ icon: Icon, badge, title, text, actions, link, highlight }, index) => (
        <article key={`${index}-${title}`} className={`${className} ${highlight ? "airport-info-card-highlight" : ""}`}>
          {badge ? <span className="airport-info-card-badge">{badge}</span> : Icon && <span className="airport-info-card-icon"><Icon aria-hidden="true" /></span>}
          <h3>{title}</h3>
          <p>{text}</p>
          {actions && <Buttons buttons={actions.map((action) => ({ href: actionHref(page, action), label: action.label }))} />}
          {link && <Link className="airport-card-link" href={link.href}>{link.label} <ArrowRight aria-hidden="true" /></Link>}
        </article>
      ))}
    </div>
  )
}

export type GuideContent = AirportBrief["guide"] & { body?: React.ReactNode; eyebrow?: string; id?: string }

/** "Plan your journey": used by the briefs, and by the CMS Airport Terminal and Getting To cards. */
export function GuideSection({ page, guide }: { page: AirportPagePresentation; guide: GuideContent }) {
  return (
    <section id={guide.id ?? BRIEF_GUIDE_ID} className="airport-travel-info" data-preview-section="travel_information">
      <div className="airport-container">
        <SectionHeading eyebrow={guide.eyebrow ?? "Plan your journey"} title={guide.heading} paragraphs={guide.paragraphs} body={guide.body} />
        {guide.groups.map((group, index) => (
          <div key={`${index}-${group.title}`}>
            {group.title && <h3 className="airport-card-group-title">{group.title}</h3>}
            <CardGrid page={page} cards={group.cards} columns={group.columns} className="airport-info-card" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function BriefGuideSection({ page, brief }: { page: AirportPagePresentation; brief: AirportBrief }) {
  return <GuideSection page={page} guide={brief.guide} />
}

export function BriefDeparturesSection({ page, brief }: { page: AirportPagePresentation; brief: AirportBrief }) {
  return <DeparturesSection page={page} departures={brief.departures} />
}

export type DeparturesContent = AirportBrief["departures"] & { body?: React.ReactNode }

/** Drop-off and departure cards: used by the briefs and by the CMS Departures section. */
export function DeparturesSection({ page, departures }: { page: AirportPagePresentation; departures: DeparturesContent }) {
  const { eyebrow, heading, paragraphs, body, cards } = departures
  return (
    <section className="airport-comfort" data-preview-section="departures">
      <div className="airport-container">
        <SectionHeading eyebrow={eyebrow} title={heading} paragraphs={paragraphs} body={body} />
        <CardGrid page={page} cards={cards} columns={cards.length === 4 ? 4 : 3} />
      </div>
    </section>
  )
}

export type TravellersContent = AirportBrief["travellers"] & { body?: React.ReactNode }

/** "Who we drive": used by the briefs and by the CMS section of the same name. */
export function TravellersSection({ page, travellers }: { page: AirportPagePresentation; travellers: TravellersContent }) {
  return (
    <section className="airport-benefits" data-preview-section="travellers">
      <div className="airport-container">
        <SectionHeading eyebrow="Who we drive" title={travellers.heading} paragraphs={travellers.lead ? [travellers.lead] : []} body={travellers.body} />
        <CardGrid page={page} cards={travellers.cards} columns={travellers.cards.length === 4 ? 4 : 3} />
      </div>
    </section>
  )
}

function BriefTravellersSection({ page, brief }: { page: AirportPagePresentation; brief: AirportBrief }) {
  return <TravellersSection page={page} travellers={brief.travellers} />
}

export type CitiesContent = NonNullable<AirportBrief["cities"]> & { eyebrow?: string; body?: React.ReactNode }

function BriefCitiesSection({ page, brief }: { page: AirportPagePresentation; brief: AirportBrief }) {
  return brief.cities ? <CitiesSection page={page} cities={brief.cities} /> : null
}

/** The town-by-town booking grid: used by the briefs and by the CMS "Places you can book from" section. */
export function CitiesSection({ page, cities }: { page: AirportPagePresentation; cities: CitiesContent }) {
  const { eyebrow = "London and the UK", heading, paragraphs, body, listHeading, places, closing, cta } = cities
  return (
    <section id={BRIEF_DESTINATIONS_ID} className="airport-comfort" data-preview-section="city_routes">
      <div className="airport-container">
        <SectionHeading eyebrow={eyebrow} title={heading} paragraphs={paragraphs} body={body} />
        <h3 className="airport-card-group-title">{listHeading}</h3>
        <div className="airport-card-grid airport-card-grid-3">
          {places.map((place) => {
            const links = placeLinks(page, place)
            return (
              <article key={place.label} className="airport-city-card">
                <h4><MapPin aria-hidden="true" />{place.href ? <Link href={place.href}>{place.name}</Link> : place.name}</h4>
                <Buttons buttons={[{ href: links.fromAirport, label: `${place.label} to ${page.shortName}` }, { href: links.toAirport, label: `${page.shortName} to ${place.label}` }]} />
                {place.href && <Link className="airport-card-link" href={place.href}>{place.hrefLabel} <ArrowRight aria-hidden="true" /></Link>}
              </article>
            )
          })}
          <article className="airport-city-card airport-city-card-more">
            <h4><Building2 aria-hidden="true" />Other UK destinations</h4>
            <Buttons buttons={[{ href: page.bookingLinks.fromAirport, label: "Get a quote" }, { href: "/destinations", label: "All destinations" }]} />
          </article>
        </div>
        {closing && <p className="airport-travel-info-closing">{closing}</p>}
        <Button className="mt-6" nativeButton={false} render={<Link href={page.bookingLinks.fromAirport} />}>{cta} <ArrowRight className="size-4" /></Button>
      </div>
    </section>
  )
}

function PlaceCards({ page, places, titleFrom, icon: Icon, origin }: { page: AirportPagePresentation; places: BriefPlace[]; titleFrom: string; icon: LucideIcon; origin?: BriefPlace }) {
  return (
    <div className={`airport-card-grid ${places.length === 4 ? "airport-card-grid-2" : "airport-card-grid-3"}`}>
      {places.map((place) => {
        const links = placeLinks(page, place, origin)
        return (
          <article key={place.label} className="airport-link-card">
            <span className="airport-info-card-icon"><Icon aria-hidden="true" /></span>
            <h3>{titleFrom} to {place.href ? <Link href={place.href}>{place.name}</Link> : place.name} Taxi</h3>
            <p>{place.text}</p>
            <Buttons buttons={[{ href: links.toAirport, label: `${page.shortName} to ${place.label}` }, { href: links.fromAirport, label: `${place.label} to ${page.shortName}` }]} />
            {place.href && <Link className="airport-card-link" href={place.href}>{place.hrefLabel} <ArrowRight aria-hidden="true" /></Link>}
          </article>
        )
      })}
    </div>
  )
}

export function BriefAirportsSection({ page, brief }: { page: AirportPagePresentation; brief: AirportBrief }) {
  const { heading, paragraphs, titleFrom, places, closing, origin } = brief.airports
  return (
    <section className="airport-benefits" data-preview-section="airport_routes">
      <div className="airport-container">
        <SectionHeading eyebrow="Airport connections" title={heading} paragraphs={paragraphs} />
        <PlaceCards page={page} places={places} titleFrom={titleFrom} icon={PlaneLanding} origin={origin} />
        {closing && <p className="airport-travel-info-closing">{closing}</p>}
      </div>
    </section>
  )
}

function BriefPortsSection({ page, brief }: { page: AirportPagePresentation; brief: AirportBrief }) {
  return brief.ports ? <PortsSection page={page} ports={brief.ports} /> : null
}

export type PortsContent = Omit<NonNullable<AirportBrief["ports"]>, "note"> & { note?: string; body?: React.ReactNode }

/** Ferry port and cruise terminal cards: used by the briefs and by the CMS "Ferry & cruise information" section. */
export function PortsSection({ page, ports }: { page: AirportPagePresentation; ports: PortsContent }) {
  const { heading, paragraphs, body, titleFrom, places, note } = ports
  return (
    <section className="airport-comfort" data-preview-section="ferry_cruise">
      <div className="airport-container">
        <SectionHeading eyebrow="Fly-cruise transfers" title={heading} paragraphs={paragraphs} body={body} />
        <PlaceCards page={page} places={places} titleFrom={titleFrom} icon={Ship} />
        {note && <p className="airport-note"><Info aria-hidden="true" /><span><strong>Important:</strong> {note}</span></p>}
      </div>
    </section>
  )
}

/** The section list for an airport's AIRPORT_COPY entry, in reading order around the CMS sections. */
export function briefSections(key: string, brief: AirportBrief) {
  const bind = (Section: (props: { page: AirportPagePresentation; brief: AirportBrief }) => React.ReactNode) => function BriefSection({ page }: { page: AirportPagePresentation }) { return <Section page={page} brief={brief} /> }
  return [
    { key: `${key}-guide`, order: 42, Component: bind(BriefGuideSection) },
    { key: `${key}-departures`, order: 44, Component: bind(BriefDeparturesSection) },
    { key: `${key}-travellers`, order: 62, Component: bind(BriefTravellersSection) },
    { key: `${key}-cities`, order: 64, Component: bind(BriefCitiesSection) },
    { key: `${key}-airports`, order: 66, Component: bind(BriefAirportsSection) },
    { key: `${key}-ports`, order: 68, Component: bind(BriefPortsSection) },
  ]
}

/** The fixed-prices panel under the vehicle cards. */
export function BriefPricingPanel({ page, pricing }: { page: AirportPagePresentation; pricing: BriefPricing }) {
  return (
    <div className="airport-pricing-panel">
      <span className="airport-info-card-icon"><Car aria-hidden="true" /></span>
      <div>
        <h3>{pricing.heading}</h3>
        {pricing.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <Button size="lg" variant="secondary" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>{pricing.cta} <ArrowRight className="size-4" /></Button>
    </div>
  )
}
