import { BadgeDollarSign, Headset, PlaneLanding, ShieldCheck } from "lucide-react"

const FEATURES = [
  {
    icon: BadgeDollarSign,
    title: "Fixed-price, no surge",
    text: "The price you see is the price you pay — locked in at booking, even in traffic or at peak hours.",
  },
  {
    icon: PlaneLanding,
    title: "Flight tracking included",
    text: "We watch your flight in real time and adjust pickup automatically when schedules change.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted, insured drivers",
    text: "Every chauffeur is background-checked, licensed, and trained for a safe, smooth ride.",
  },
  {
    icon: Headset,
    title: "24/7 human support",
    text: "Real people on call around the clock, in case plans change before or during your trip.",
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div className="max-w-md">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for travelers who value their time
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            We obsess over the details that matter on travel day so you can simply
            land, relax, and go.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="hover-lift rounded-2xl border border-border/70 bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
