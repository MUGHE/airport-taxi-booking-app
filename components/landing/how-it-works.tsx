import { CalendarCheck, CarFront, PlaneLanding, Receipt } from "lucide-react"

const STEPS = [
  {
    icon: Receipt,
    title: "Get an instant quote",
    text: "Enter your route and see a fixed, all-inclusive fare in seconds. No hidden fees.",
  },
  {
    icon: CalendarCheck,
    title: "Book your transfer",
    text: "Add your flight number and pickup details. Pay later or confirm in advance.",
  },
  {
    icon: PlaneLanding,
    title: "We track your flight",
    text: "Your driver monitors arrivals and adjusts for delays — no extra charge for waiting.",
  },
  {
    icon: CarFront,
    title: "Meet & ride",
    text: "Your chauffeur greets you at arrivals and takes you door to door in comfort.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Booking a ride takes a minute
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          A simple, transparent process built for the realities of air travel.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-2xl border border-border/70 bg-card p-6"
          >
            <span className="absolute right-5 top-5 text-sm font-semibold text-muted-foreground/40">
              0{i + 1}
            </span>
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <step.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
