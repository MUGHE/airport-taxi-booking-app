import Link from "next/link"
import { ArrowRight, Check, MapPin } from "lucide-react"

const INCLUDED = [
  {
    title: "A fixed price, confirmed before you pay",
    text: "No meters and no surge pricing. Your fare only changes if your journey does, such as adding a stop.",
  },
  {
    title: "Flight tracked, driver waiting at the terminal",
    text: "Add your flight number and we follow it live, moving your pickup if you land early or late.",
  },
  {
    title: "60 minutes free waiting at the airport",
    text: "Counted from when your flight actually lands, so baggage reclaim and passport control are covered.",
  },
  {
    title: "Licensed, background-checked drivers",
    text: "Professional drivers in clean, comfortable cars, with child seats available when you book.",
  },
]

export function TransferIntro() {
  return (
    <section className="landing-intro" aria-labelledby="landing-intro-title">
      <div className="landing-container landing-intro-grid">
        <div className="landing-intro-copy">
          <span className="landing-eyebrow">Airport taxis across London</span>
          <h2 id="landing-intro-title">Reliable Heathrow Airport Transfers, Honest Fixed Pricing</h2>
          <p>
            Based in Slough, ONE Airport Taxi provides dependable 24/7 transfers directly connecting
            London Heathrow (LHR), Central London, and all UK airports. Whether travelling for
            business or leisure from Slough, Windsor, or across Berkshire, enjoy guaranteed fixed
            fares, live flight tracking, and complimentary waiting time with licensed professional
            drivers.
          </p>
          <p>
            We cover Heathrow, Gatwick, Stansted, Luton, London City and Southend, with
            door-to-door transfers to homes, hotels and offices across London.
          </p>
          <Link href="/airport-transfers" className="landing-arrow-link">
            See all airports and fares <ArrowRight aria-hidden="true" />
          </Link>

          <div className="landing-local-areas">
            <h3 className="landing-intro-list-title">Local service areas</h3>
            {/* Only towns with a published page are links. */}
            <p>
              <MapPin aria-hidden="true" />
              <span>
                Serving Slough, Windsor, Maidenhead, <Link href="/destinations/reading-taxi">Reading</Link>, Ascot,
                and surrounding areas with fast pickups to <Link href="/airport-transfers/heathrow-airport-taxi">Heathrow</Link>.
              </span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="landing-intro-list-title">Included with every airport transfer</h3>
          <ul className="landing-intro-list">
            {INCLUDED.map((item) => (
              <li key={item.title}>
                <Check aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
