import Link from "next/link"
import { ArrowRight, Baby, Briefcase, Building2, Car, Info, MapPin, PlaneLanding, PlaneTakeoff, Route, Ship, TrainFront, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createAirportBookingLinks, createRouteBookingLinks, type AirportPagePresentation } from "@/lib/airport-page-data"
import { HEATHROW_AIRPORT_ROUTES, HEATHROW_CITIES, HEATHROW_PORT_ROUTES, HEATHROW_TERMINAL_INFO, type HeathrowPlace } from "@/lib/heathrow-page"

const linkClass = "font-semibold text-primary underline decoration-primary/30 underline-offset-4"

function primaryTerminal(page: AirportPagePresentation) {
  return page.terminals.find((terminal) => terminal.isPrimary) ?? page.terminals[0]
}

/** Booking links between Heathrow and a place: `toAirport` is Heathrow -> place, `fromAirport` is place -> Heathrow. */
function placeLinks(page: AirportPagePresentation, place: HeathrowPlace) {
  const heathrow = primaryTerminal(page)
  if (!heathrow) return { toAirport: page.bookingLinks.toAirport, fromAirport: page.bookingLinks.fromAirport }
  return createRouteBookingLinks(heathrow, { name: place.address, latitude: place.latitude, longitude: place.longitude })
}

function terminalLinks(page: AirportPagePresentation, label: string) {
  const terminal = page.terminals.find((item) => item.name.toLowerCase().endsWith(label.toLowerCase()))
  return terminal ? createAirportBookingLinks(terminal) : page.bookingLinks
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="airport-travel-info-intro"><p className="airport-eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</div>
}

function CardButtons({ primary, secondary }: { primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <div className="airport-card-actions">
      <Button size="sm" nativeButton={false} render={<Link href={primary.href} />}>{primary.label} <ArrowRight aria-hidden="true" /></Button>
      {secondary && <Button size="sm" variant="outline" nativeButton={false} render={<Link href={secondary.href} />}>{secondary.label}</Button>}
    </div>
  )
}

/** "Heathrow Airport Information and Travel Guide": the four terminals as cards, then how to get there. */
export function HeathrowGuideSection() {
  return (
    <section id="heathrow-terminals" className="airport-travel-info" data-preview-section="travel_information">
      <div className="airport-container">
        <SectionHeading eyebrow="Plan your journey" title="Heathrow Airport Information and Travel Guide">
          <p>London Heathrow (LHR) is one of the UK’s major international airports, sitting west of Central London. It handles domestic and international flights across four operational passenger terminals: Terminal 2, 3, 4 and 5.</p>
          <p>The airport connects London to destinations worldwide and offers many ways to get in and out, including rail, Underground, and road. If you’re travelling to or from Heathrow, a bit of planning around your terminal, pickup point and onward journey makes the day much easier. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</p>
        </SectionHeading>

        <h3 className="airport-card-group-title">Heathrow Airport Terminals</h3>
        <div className="airport-card-grid airport-card-grid-4">
          {HEATHROW_TERMINAL_INFO.map((terminal) => (
            <article key={terminal.label} className="airport-info-card">
              <span className="airport-info-card-badge">{terminal.label.replace("Terminal ", "T")}</span>
              <h4>{terminal.title}</h4>
              <p>{terminal.info}</p>
            </article>
          ))}
        </div>

        <article className="airport-info-card airport-info-card-wide">
          <span className="airport-info-card-icon"><TrainFront aria-hidden="true" /></span>
          <div>
            <h4>Getting to Heathrow Airport</h4>
            <p>By road, Heathrow is reached via the M4 and M25. You can also use the Heathrow Express, the Elizabeth line or the Piccadilly line.</p>
            <p>Public transport is a good option for light travellers. But when you have several suitcases, children, business equipment, or a group, a private taxi is much more convenient.</p>
            <p>With One Airport Taxi, your journey is door-to-door. We take you from your home, hotel, or office straight to your terminal.</p>
          </div>
        </article>
      </div>
    </section>
  )
}

/** "Taxi to Heathrow Terminal 2, 3, 4 and 5": a card per terminal with drop-off and pickup booking buttons. */
export function HeathrowTerminalTransfersSection({ page }: { page: AirportPagePresentation }) {
  return (
    <section className="airport-comfort" data-preview-section="terminal_transfers">
      <div className="airport-container">
        <SectionHeading eyebrow="Every terminal" title="Taxi to Heathrow Terminal 2, 3, 4 and 5">
          <p>Need a taxi to Heathrow? We run pre-booked transfers to all four operational passenger terminals. When booking, select the correct terminal and add your flight details where asked. It helps us plan the journey and get the pickup or drop-off right.</p>
        </SectionHeading>
        <div className="airport-card-grid airport-card-grid-4">
          {HEATHROW_TERMINAL_INFO.map((terminal) => {
            const links = terminalLinks(page, terminal.label)
            return (
              <article key={terminal.label} className="airport-link-card">
                <span className="airport-info-card-icon"><PlaneTakeoff aria-hidden="true" /></span>
                <h3>Taxi to Heathrow {terminal.label}</h3>
                <p>{terminal.transfer}</p>
                <CardButtons primary={{ href: links.toAirport, label: `To ${terminal.label}` }} secondary={{ href: links.fromAirport, label: `From ${terminal.label}` }} />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const travellerCards = [
  { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or a mountain of suitcases? Pick a vehicle with the space to match. You can request a child seat when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
  { icon: Briefcase, title: "Business Airport Transfers", text: "A professional Heathrow taxi for meetings, corporate travel and flight connections. Executive vehicles are there for anyone who wants a more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
  { icon: UsersRound, title: "Group Airport Transfers", text: "Friends, colleagues or the extended family? Our MPVs and 8-seater minibuses handle larger groups. Check the luggage capacity before you confirm your vehicle.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
  { icon: Route, title: "Long-Distance Airport Journeys", text: "Heathrow is a common starting point for journeys well beyond London. Arrange a private transfer to destinations across the UK, with the fare agreed up front.", link: { href: "#heathrow-destinations", label: "Popular Heathrow journeys" } },
]

export function HeathrowTravellersSection() {
  return (
    <section className="airport-benefits" data-preview-section="travellers">
      <div className="airport-container">
        <SectionHeading eyebrow="Who we drive" title="Heathrow Airport Taxi Service for Families, Business Travellers and Groups">
          <p>Different trips need different things. We offer vehicle options and pre-booked journeys to cover them all.</p>
        </SectionHeading>
        <div className="airport-card-grid airport-card-grid-4">
          {travellerCards.map(({ icon: Icon, title, text, link }) => (
            <article key={title} className="airport-link-card">
              <span className="airport-info-card-icon"><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link className="airport-card-link" href={link.href}>{link.label} <ArrowRight aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** "Heathrow Airport Taxi Transfers Across London and the UK": one bookable card per town. */
export function HeathrowCitiesSection({ page }: { page: AirportPagePresentation }) {
  return (
    <section id="heathrow-destinations" className="airport-comfort" data-preview-section="city_routes">
      <div className="airport-container">
        <SectionHeading eyebrow="London and the UK" title="Heathrow Airport Taxi Transfers Across London and the UK">
          <p>From Central London, West London or a town outside the capital, we can arrange a pre-booked transfer to Heathrow. We cover journeys between Heathrow and homes, hotels, business addresses and other destinations right across the UK.</p>
        </SectionHeading>
        <h3 className="airport-card-group-title">You can arrange a taxi to Heathrow from places like:</h3>
        <div className="airport-card-grid airport-card-grid-3">
          {HEATHROW_CITIES.map((city) => {
            const links = placeLinks(page, city)
            return (
              <article key={city.name} className="airport-city-card">
                <h4><MapPin aria-hidden="true" />{city.href ? <Link href={city.href}>{city.name}</Link> : city.name}</h4>
                <div className="airport-card-actions">
                  <Button size="sm" nativeButton={false} render={<Link href={links.fromAirport} />}>{city.name} to Heathrow <ArrowRight aria-hidden="true" /></Button>
                  <Button size="sm" variant="outline" nativeButton={false} render={<Link href={links.toAirport} />}>Heathrow to {city.name}</Button>
                </div>
                {city.href && <Link className="airport-card-link" href={city.href}>{city.hrefLabel} <ArrowRight aria-hidden="true" /></Link>}
              </article>
            )
          })}
          <article className="airport-city-card airport-city-card-more">
            <h4><Building2 aria-hidden="true" />Other UK destinations</h4>
            <div className="airport-card-actions">
              <Button size="sm" nativeButton={false} render={<Link href={page.bookingLinks.fromAirport} />}>Get a quote <ArrowRight aria-hidden="true" /></Button>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/destinations" />}>All destinations</Button>
            </div>
          </article>
        </div>
        <p className="airport-travel-info-closing">You can also book a taxi from Heathrow to any of these places or even further away. Just enter your exact journey details to see the fare.</p>
        <Button className="mt-6" nativeButton={false} render={<Link href={page.bookingLinks.fromAirport} />}>Get a Quote for Your Heathrow Journey <ArrowRight className="size-4" /></Button>
      </div>
    </section>
  )
}

/** "Heathrow to Other London Airports": a card per airport, linking its airport page and the route fare. */
export function HeathrowAirportRoutesSection({ page }: { page: AirportPagePresentation }) {
  return (
    <section className="airport-benefits" data-preview-section="airport_routes">
      <div className="airport-container">
        <SectionHeading eyebrow="Airport connections" title="Heathrow to Other London Airports – Private Airport Transfers">
          <p>Connecting between airports can be stressful, especially if you have luggage and a tight schedule. A pre-booked private transfer takes you straight there, so you don’t have to carry your bags through stations. We run airport-to-airport transfers from Heathrow to the other major London airports.</p>
        </SectionHeading>
        <div className="airport-card-grid airport-card-grid-3">
          {HEATHROW_AIRPORT_ROUTES.map((airport) => {
            const links = placeLinks(page, airport)
            return (
              <article key={airport.name} className="airport-link-card">
                <span className="airport-info-card-icon"><PlaneLanding aria-hidden="true" /></span>
                <h3>Heathrow to <Link href={airport.href!}>{airport.name} Airport</Link> Taxi</h3>
                <p>{airport.text}</p>
                <CardButtons primary={{ href: links.toAirport, label: `Heathrow to ${airport.name}` }} secondary={{ href: links.fromAirport, label: `${airport.name} to Heathrow` }} />
                <Link className="airport-card-link" href={airport.href!}>{airport.name} Airport taxi guide <ArrowRight aria-hidden="true" /></Link>
              </article>
            )
          })}
        </div>
        <p className="airport-travel-info-closing">Return transfers from all of these airports back to Heathrow are available too.</p>
      </div>
    </section>
  )
}

/** "Heathrow Airport to Ferry Ports and Cruise Terminals". */
export function HeathrowPortsSection({ page }: { page: AirportPagePresentation }) {
  return (
    <section className="airport-comfort" data-preview-section="ferry_cruise">
      <div className="airport-container">
        <SectionHeading eyebrow="Fly-cruise transfers" title="Heathrow Airport to Ferry Ports and Cruise Terminals">
          <p>Plenty of international passengers land at Heathrow and carry straight on to a UK ferry port or cruise terminal. With cruise luggage or a group in tow, sorting the onward transport in advance makes the whole trip calmer. We offer pre-booked private transfers from Heathrow to the major ferry and cruise ports.</p>
        </SectionHeading>
        <div className="airport-card-grid airport-card-grid-3">
          {HEATHROW_PORT_ROUTES.map((port) => {
            const links = placeLinks(page, port)
            return (
              <article key={port.name} className="airport-link-card">
                <span className="airport-info-card-icon"><Ship aria-hidden="true" /></span>
                <h3>Heathrow to {port.href ? <Link href={port.href}>{port.name}</Link> : port.name} Taxi</h3>
                <p>{port.text}</p>
                <CardButtons primary={{ href: links.toAirport, label: "Get my fixed price" }} secondary={{ href: links.fromAirport, label: "Return to Heathrow" }} />
                {port.href && <Link className="airport-card-link" href={port.href}>{port.hrefLabel} <ArrowRight aria-hidden="true" /></Link>}
              </article>
            )
          })}
        </div>
        <p className="airport-note"><Info aria-hidden="true" /><span><strong>Important:</strong> For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers, and the amount of luggage you have. This information helps us plan the right vehicle and pickup for you.</span></p>
      </div>
    </section>
  )
}

/** "Fixed Heathrow Airport Taxi Prices", shown under the vehicle cards. */
export function HeathrowPricing({ page }: { page: AirportPagePresentation }) {
  return (
    <div className="airport-pricing-panel">
      <span className="airport-info-card-icon"><Car aria-hidden="true" /></span>
      <div>
        <h3>Fixed Heathrow Airport Taxi Prices</h3>
        <p>Your quote comes before you confirm. Enter your pickup, destination, travel date, and passenger requirements to see what’s available.</p>
        <p>Our pricing is straightforward, so you can compare vehicles and plan your trip without having to read through a lot of fine print.</p>
      </div>
      <Button size="lg" variant="secondary" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Compare Heathrow Taxi Prices <ArrowRight className="size-4" /></Button>
    </div>
  )
}
