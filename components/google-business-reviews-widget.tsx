"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Quote, Star } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { loadGoogleMaps, whenVisitorEngages } from "@/lib/places"

type Review = {
  id: string
  rating: number
  text: string
  published: string
  author: string
  authorUrl?: string
  reviewUrl?: string
}

type BusinessReviews = {
  rating: number
  reviewCount: number
  mapsUrl: string
  attributions: string[]
  reviews: Review[]
}

export function GoogleBusinessReviewsWidget({
  placeId,
  variant = "landing",
  title = "What our customers say.",
}: {
  placeId: string
  variant?: "landing" | "airport"
  title?: string
}) {
  const [business, setBusiness] = useState<BusinessReviews | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadReviews() {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!placeId || !apiKey) {
        console.error("Google reviews could not load: business Place ID or browser Maps key is missing.")
        setLoadFailed(true)
        return
      }

      try {
        await whenVisitorEngages()
        if (cancelled) return
        await loadGoogleMaps(apiKey)
        const { Place } = await (window as any).google.maps.importLibrary("places")
        const place = new Place({ id: placeId })
        await place.fetchFields({ fields: ["rating", "userRatingCount", "googleMapsURI", "reviews"] })

        if (cancelled) return
        const mapsUrl = place.googleMapsURI || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`
        const reviews = (place.reviews ?? []).map((review: any, index: number) => ({
          id: review.googleMapsURI || `${placeId}-review-${index}`,
          rating: Math.max(0, Math.min(5, Number(review.rating) || 0)),
          text: typeof review.text === "string" ? review.text.trim() : "",
          published: review.relativePublishTimeDescription || "",
          author: review.authorAttribution?.displayName || "Google reviewer",
          authorUrl: review.authorAttribution?.uri || undefined,
          reviewUrl: review.googleMapsURI || undefined,
        })).filter((review: Review) => review.text)

        if (!reviews.length) {
          console.warn("Google Places returned no reviews for the configured business Place ID.", placeId)
          setLoadFailed(true)
          return
        }

        setBusiness({
          rating: Number(place.rating) || 0,
          reviewCount: Number(place.userRatingCount) || 0,
          mapsUrl,
          attributions: Array.isArray(place.attributions) ? place.attributions : [],
          reviews,
        })
      } catch (error) {
        console.error("Google Places review request failed. Check Maps JavaScript API, Places API (New), billing, key website restrictions, and GOOGLE_REVIEW_PLACE_ID.", error)
        if (!cancelled) setLoadFailed(true)
      }
    }

    void loadReviews()
    return () => { cancelled = true }
  }, [placeId])

  const airport = variant === "airport"
  const sectionClass = airport ? "airport-reviews" : "landing-reviews scroll-mt-20"
  const containerClass = airport ? "airport-container" : "landing-container"

  if (!business) {
    if (!loadFailed) return <div className="sr-only" aria-live="polite">Loading Google reviews…</div>
    const mapsUrl = placeId ? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}` : "https://www.google.com/maps"
    return <section id={airport ? undefined : "reviews"} className={sectionClass} data-preview-section={airport ? "reviews" : undefined}><div className={containerClass}><div className={airport ? "airport-review-heading" : "landing-section-heading"}><div><span className={airport ? "airport-eyebrow" : "landing-eyebrow"}>Google reviews</span><h2>{title}</h2></div><p>Google reviews are temporarily unavailable. <a href={mapsUrl} target="_blank" rel="noopener noreferrer">View our Google profile</a>.</p></div></div></section>
  }

  return (
    <section id={airport ? undefined : "reviews"} className={sectionClass} data-preview-section={airport ? "reviews" : undefined}>
      <div className={containerClass}>
        <div className={airport ? "airport-review-heading" : "landing-section-heading"}>
          <div><span className={airport ? "airport-eyebrow" : "landing-eyebrow"}>Google reviews</span><h2>{title}</h2></div>
          <p><strong>★ {business.rating.toFixed(1)} from {business.reviewCount.toLocaleString("en-GB")} Google reviews</strong> · <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer">Read them all on Google →</a></p>
        </div>
        {business.attributions.length > 0 && <p className="mt-3 text-center text-xs text-muted-foreground">{business.attributions.join(" · ")}</p>}
        <div className="relative mt-12">
          {/* A grid, not a carousel: every review is visible without sideways scrolling. */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="region" aria-label="Google customer reviews">
            {business.reviews.map((review, index) => (
            <article data-review-card key={review.id} className={`${airport ? "airport-review-card" : "landing-review-card"} min-w-0`} aria-label={`Review ${index + 1} of ${business.reviews.length}`}>
              <Quote aria-hidden="true" className={airport ? undefined : "landing-review-quote"} />
              <span className={airport ? "airport-review-stars" : "landing-review-stars"} aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: Math.round(review.rating) }, (_, index) => <Star aria-hidden="true" key={index} />)}
              </span>
              <p>“{review.text}”</p>
              <footer>
                {!airport && <span className="landing-review-avatar">{review.author.slice(0, 1).toUpperCase()}</span>}
                <div>
                  <strong><a href={review.authorUrl ?? business.mapsUrl} target="_blank" rel="noopener noreferrer">{review.author}</a></strong>
                  <small>{review.published}{review.reviewUrl && <> · <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer">View on Google Maps</a></>}</small>
                </div>
              </footer>
            </article>
          ))}
          </div>
        </div>
        <div className="landing-section-action"><Link href="/book" className={buttonVariants({ size: "lg" })}>Get My Fixed Price <ArrowRight aria-hidden="true" /></Link></div>
      </div>
    </section>
  )
}
