import Link from "next/link"
import { ArrowRight, CarFront, MapPinned, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    icon: MapPinned,
    title: "Enter your journey",
    text: "Add your pickup, destination and flight number. It takes under a minute.",
  },
  {
    icon: Receipt,
    title: "Get your fixed price",
    text: "See the full fare instantly, with no obligation to book. Pay securely when you're ready.",
  },
  {
    icon: CarFront,
    title: "Meet your driver",
    text: "We track your flight and your driver waits at the terminal meeting point, even if you land early or late.",
  },
]

export function ProcessSteps() {
  return (
    <section id="how" className="landing-process scroll-mt-20">
      <div className="landing-container">
      <div className="landing-section-heading">
        <div>
        <span className="landing-eyebrow">
          How it works
        </span>
        <h2>Booked in a minute. Met when you land.</h2>
        </div>
        <p>Three steps, one fixed price, and no surprises on the day.</p>
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

      <div className="landing-section-action">
        <Button size="lg" nativeButton={false} render={<Link href="/book" />}>
          Get My Fixed Price <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      </div>
    </section>
  )
}
