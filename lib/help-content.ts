// The Help Centre quick guide on /help (app/help/page.tsx): short, task-based answers that point to
// the matching FAQ (lib/faqs.ts) for the detail, so the two sections never repeat each other.
// Every answer describes how this website actually handles the topic — kept in sync with the
// booking flow, tracking page, and cancellation policy (lib/terms-content.ts).

export type HelpGuideItem = {
  id: string
  title: string
  body: string[]
  /** Id of the FAQ in lib/faqs.ts that answers this topic in full. */
  faq?: string
}

export type HelpGuideCategory = {
  id: string
  title: string
  items: HelpGuideItem[]
}

export const HELP_GUIDE: HelpGuideCategory[] = [
  {
    id: "plan",
    title: "Plan your trip",
    items: [
      {
        id: "booking-steps",
        title: "Booking steps",
        body: ["Enter your route, pick a date, time and vehicle, then add passenger details and confirm."],
        faq: "how-to-book",
      },
      {
        id: "fixed-price",
        title: "Are your prices fixed, or can they change?",
        body: [
          "The fare shown when you pick your vehicle is the fare you pay — it's calculated from your route and locked in at booking, so it doesn't change for traffic, time of day, or demand.",
          "The only things that add to it are choices you make at checkout: extra stops along the route, optional add-ons, or a return leg — each is shown as a separate line before you pay.",
        ],
      },
      {
        id: "choosing-vehicle",
        title: "Choosing a vehicle",
        body: ["Compare seats, bags and the price for your route side by side on the Pick your vehicle step."],
        faq: "vehicle-types",
      },
      {
        id: "trip-extras",
        title: "Stops, extras and returns",
        body: ["Add up to 3 stops on the Trip step. Child seats, meet & greet and a return leg go on the Details step."],
        faq: "return-journey",
      },
    ],
  },
  {
    id: "at-the-airport",
    title: "At the airport",
    items: [
      {
        id: "flight-tracking",
        title: "Flight tracking",
        body: ["Your pickup follows your real landing time once you add a flight number. Non-airport pickups include 15 minutes' free waiting."],
        faq: "flight-delayed",
      },
      {
        id: "airport-pickup",
        title: "Airport pickup",
        body: ["Once you're through arrivals, go to the terminal meeting point named in your booking details. Other pickups start at your address."],
        faq: "find-driver",
      },
    ],
  },
  {
    id: "paying",
    title: "Paying",
    items: [
      {
        id: "payment-options",
        title: "Payment options",
        body: ["Choose on the Review step: card through Stripe's secure checkout, or cash to your driver."],
        faq: "payment-methods",
      },
      {
        id: "promo-codes",
        title: "Do you offer promo codes or discounts?",
        body: [
          "If you have a promo code, enter it in the trip summary before you pay and it's applied instantly. When a site-wide promotion is running, it's applied automatically and shown as a banner with the discounted price — no code needed.",
        ],
      },
    ],
  },
  {
    id: "after-booking",
    title: "After you book",
    items: [
      {
        id: "track-status",
        title: "How do I check my booking status?",
        body: [
          "Use Track Booking with your reference number, or the direct link in your confirmation email. Status shows as Pending payment, Confirmed, Driver assigned, Completed, or Cancelled.",
        ],
      },
      {
        id: "change-cancel",
        title: "Can I change or cancel my booking online?",
        body: [
          "Tracking a booking shows its live details, but changes and cancellations are handled by our team rather than self-service on the site — contact us with your reference and we'll take care of it.",
        ],
      },
      {
        id: "cancel-refunds",
        title: "Cancellation refunds",
        body: ["How much comes back depends on how long before pickup you cancel."],
        faq: "cancellation-policy",
      },
    ],
  },
  {
    id: "get-help",
    title: "Get help",
    items: [
      {
        id: "reach-us",
        title: "Reach our team",
        body: ["Tap the help button in the corner of any page, or use the call, WhatsApp and email buttons at the bottom of this page."],
        faq: "hours",
      },
    ],
  },
]
