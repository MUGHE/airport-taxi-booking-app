import { CarFront, MapPinned, Receipt } from "lucide-react"

const STEPS = [
  {
    icon: MapPinned,
    title: "Tell us your route",
    text: "Enter your pickup and drop-off details, plus your travel time.",
  },
  {
    icon: Receipt,
    title: "See your fixed price",
    text: "Get an instant, no-obligation price for your journey.",
  },
  {
    icon: CarFront,
    title: "Meet your chauffeur",
    text: "Your driver will be there, with flight tracking and meet & greet.",
  },
]

export function ProcessSteps() {
  return (
    <section id="how" className="landing-process scroll-mt-20">
      <div className="landing-container">
      <div className="landing-section-heading">
        <div>
        <span className="landing-eyebrow">
          Simple. Reliable. Stress-free.
        </span>
        <h2>From flight details to front door.</h2>
        </div>
        <p>Three simple steps. One clear price. No last-minute surprises.</p>
      </div>

      <div className="landing-process-grid">
        {STEPS.map((step, i) => (
          <article key={step.title} className="landing-process-card">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <step.icon aria-hidden="true" />
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
      </div>
    </section>
  )
}
