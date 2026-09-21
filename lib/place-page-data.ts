import type { DestinationContentDocument, DestinationSection, RichTextBlock } from "@/lib/destination-content"
import type { GlobalFaq, ServiceFact, VerifiedReview } from "@/lib/reusable-content"

export type PlacePagePresentation = {
  displayName: string
  heading: string
  intro: RichTextBlock[]
  heroImage?: DestinationContentDocument["hero"]["image"]
  sections: DestinationSection[]
  finalCta: DestinationContentDocument["finalCta"]
  supportedAirports: { id: string; displayName: string; slug: string; description: string; bookingAvailable: boolean }[]
  nearbyPlaces: { id: string; displayName: string; slug: string; description: string }[]
  serviceFacts: ServiceFact[]
  globalFaqs: GlobalFaq[]
  localFaqs: GlobalFaq[]
  reviews: VerifiedReview[]
  bookingAvailable: boolean
}
