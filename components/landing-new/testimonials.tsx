import { Star } from "lucide-react"

// Illustrative quotes for layout purposes only — not real customer testimonials.
const REVIEWS = [
  {
    initials: "SM",
    name: "Sophie M.",
    location: "London, UK",
    quote:
      "Brilliant service! Our flight was late but the driver was still there, friendly and professional. Made our trip so easy.",
  },
  {
    initials: "DK",
    name: "Daniel K.",
    location: "Manchester, UK",
    quote:
      "Clean, comfortable car and a great driver. Fixed price meant no surprises. Will definitely use again.",
  },
  {
    initials: "PS",
    name: "Priya S.",
    location: "Birmingham, UK",
    quote:
      "Excellent from start to finish. Easy booking, clear communication and a lovely driver. Highly recommended!",
  },
]

export function Testimonials() {
  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          Real journeys. Real people.
        </span>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Trusted by travelers, not just promises
        </h2>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {REVIEWS.map((review) => (
          <div key={review.name} className="hover-lift rounded-2xl border border-border/70 bg-card p-6">
            <span className="flex items-center gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-accent" />
              ))}
            </span>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{review.quote}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {review.initials}
              </span>
              <div>
                <p className="text-sm font-semibold">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
