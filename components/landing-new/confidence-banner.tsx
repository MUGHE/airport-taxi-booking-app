import { Baby, Clock, Headset, PlaneLanding } from "lucide-react"

const ITEMS = [
  {
    icon: PlaneLanding,
    title: "Delayed flight, same price",
    text: "We track your flight live and move your pickup automatically.",
  },
  {
    icon: Clock,
    title: "45 minutes free waiting",
    text: "Counted from when your flight lands, so baggage and passport control are covered.",
  },
  {
    icon: Headset,
    title: "UK-based support, 24/7",
    text: "Call or WhatsApp a real person, any time.",
  },
  {
    icon: Baby,
    title: "Child seats on request",
    text: "Add a child seat when you book and it's fitted before pickup.",
  },
]

export function ConfidenceBanner() {
  return (
    <section className="landing-confidence">
      <div className="landing-container landing-confidence-grid">
        <div className="landing-confidence-heading">
          <span className="landing-eyebrow landing-eyebrow-light">
            Plans change. We don't mind.
          </span>
          <h2>Flight late? Queue long? We'll still be there.</h2>
          <p>Delays, long passport queues and last-minute changes are part of travel. Your pickup adjusts around them, and the first 45 minutes of waiting are free.</p>
        </div>

        <div className="landing-confidence-list">
          {ITEMS.map((item) => (
            <div key={item.title} className="landing-confidence-item">
              <span><item.icon aria-hidden="true" /></span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
