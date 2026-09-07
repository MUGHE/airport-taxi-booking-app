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
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          Simple. Reliable. Stress-free.
        </span>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Book in three simple steps
        </h2>
      </div>

      <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
        <div
          aria-hidden
          className="absolute top-6 left-[16.5%] hidden h-px w-[67%] bg-border sm:block"
        />
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <step.icon className="mt-4 size-6 text-primary" />
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mt-2 max-w-[22ch] text-sm leading-relaxed text-muted-foreground">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
