import { BadgeCheck, Quote, Star } from "lucide-react"

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
    <section id="reviews" className="landing-reviews scroll-mt-20">
      <div className="landing-container">
      <div className="landing-section-heading">
        <div><span className="landing-eyebrow">Real journeys. Real people.</span><h2>The welcome our passengers remember.</h2></div>
        <p>Thoughtful drivers, clear communication, and no surprises on the meter.</p>
      </div>

      <div className="landing-review-grid">
        {REVIEWS.map((review, index) => (
          <article key={review.name} className="landing-review-card">
            <Quote aria-hidden="true" className="landing-review-quote" />
            <span className="landing-review-stars" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star aria-hidden="true" key={i} />
              ))}
            </span>
            <p>
              &ldquo;{review.quote}&rdquo;
            </p>
            <footer>
              <span className="landing-review-avatar">
                {review.initials}
              </span>
              <div>
                <strong>{review.name}</strong>
                <small><BadgeCheck aria-hidden="true" /> Verified journey · {review.location}</small>
              </div>
            </footer>
            <span className="landing-review-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          </article>
        ))}
      </div>
      </div>
    </section>
  )
}
