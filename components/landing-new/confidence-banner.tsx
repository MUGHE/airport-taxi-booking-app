import { Baby, Clock, Headset, PlaneLanding } from "lucide-react"

const ITEMS = [
  {
    icon: PlaneLanding,
    title: "Flight delay? We adjust.",
    text: "We track your flight and adjust pickup time at no extra cost.",
  },
  {
    icon: Clock,
    title: "Free waiting time",
    text: "Generous waiting time included with every airport pickup.",
  },
  {
    icon: Headset,
    title: "Local support, 24/7",
    text: "Our UK-based team is here day and night.",
  },
  {
    icon: Baby,
    title: "Child seats on request",
    text: "Travel safely with child seats available.",
  },
]

export function ConfidenceBanner() {
  return (
    <section className="landing-confidence">
      <div className="landing-container landing-confidence-grid">
        <div className="landing-confidence-heading">
          <span className="landing-eyebrow landing-eyebrow-light">
            Always on your side
          </span>
          <h2>Built around the moments travel cannot predict.</h2>
          <p>Delayed flight. Long passport queue. A change of plan. We stay ready.</p>
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
