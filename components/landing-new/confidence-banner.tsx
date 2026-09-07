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
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-wide text-primary-foreground/70 uppercase">
            Always on your side
          </span>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Travel confidently, from runway to doorstep
          </h2>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <div key={item.title} className="text-center sm:text-left">
              <item.icon className="mx-auto size-6 text-primary-foreground/80 sm:mx-0" />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
