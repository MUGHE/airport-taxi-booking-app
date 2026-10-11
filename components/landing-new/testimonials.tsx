import { GoogleBusinessReviewsWidget } from "@/components/google-business-reviews-widget"
import { GOOGLE_REVIEW_PLACE_ID } from "@/lib/company"

export function Testimonials() {
  return <GoogleBusinessReviewsWidget placeId={GOOGLE_REVIEW_PLACE_ID} />
}
