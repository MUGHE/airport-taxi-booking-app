export type ServiceFact = {
  id: string
  key: "waiting" | "cancellation" | "flight_tracking" | "meet_and_greet" | "support"
  title: string
  description: string
}

export type GlobalFaq = { id: string; question: string; answer: string }
export type VerifiedReview = { id: string; quote: string; author: string; source: string }

export const DEFAULT_SERVICE_FACTS: ServiceFact[] = [
  { id: "waiting", key: "waiting", title: "Airport waiting time", description: "Your booking includes a clear waiting allowance, so you know what is covered before you travel." },
  { id: "cancellation", key: "cancellation", title: "Clear cancellation policy", description: "You can review the cancellation terms for your booking before you confirm it." },
  { id: "flight-tracking", key: "flight_tracking", title: "Flight tracking", description: "We track your flight and adjust the pickup time when the arrival time changes." },
  { id: "meet-and-greet", key: "meet_and_greet", title: "Meet and greet", description: "Your chauffeur meets you at the agreed airport pickup point and helps you start your journey." },
  { id: "support", key: "support", title: "Customer support", description: "Our support team is available to help with your airport transfer questions." },
]

export const DEFAULT_GLOBAL_FAQS: GlobalFaq[] = [
  { id: "fixed-price", question: "Is my airport transfer price fixed?", answer: "Yes. The fare shown for your selected route and vehicle is locked in when you book." },
  { id: "book-return", question: "Can I book a return airport transfer?", answer: "Yes. Add the return journey to the same booking when you enter your trip details." },
]

export const DEFAULT_VERIFIED_REVIEWS: VerifiedReview[] = [
  { id: "review-1", quote: "The booking was simple and the driver arrived exactly where we agreed.", author: "Verified customer", source: "Verified customer review" },
  { id: "review-2", quote: "Clear communication and a comfortable airport journey from start to finish.", author: "Verified customer", source: "Verified customer review" },
]
