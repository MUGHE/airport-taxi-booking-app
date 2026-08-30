// Structured content for the Help Center (app/help/page.tsx). Every answer describes how
// this website actually handles the topic — kept in sync with the booking flow, tracking
// page, and cancellation policy (lib/terms-content.ts) rather than generic boilerplate.

export type FaqItem = {
  id: string
  q: string
  a: string[]
}

export type FaqCategory = {
  id: string
  title: string
  items: FaqItem[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "booking",
    title: "Booking & fares",
    items: [
      {
        id: "how-to-book",
        q: "How do I book a ride?",
        a: [
          "Enter your pickup and drop-off on the homepage or the Book a Ride page, then choose a date and time. You'll see a fixed price for every vehicle class before you pick one — no need to create an account.",
          "From there you add passenger details, choose how you'd like to pay, and confirm. You'll get a booking reference and a confirmation email straight away.",
        ],
      },
      {
        id: "fixed-price",
        q: "Are your prices fixed, or can they change?",
        a: [
          "The fare shown when you pick your vehicle is the fare you pay — it's calculated from your route and locked in at booking, so it doesn't change for traffic, time of day, or demand.",
          "The only things that add to it are choices you make at checkout: extra stops along the route, optional add-ons, or a return leg — each is shown as a separate line before you pay.",
        ],
      },
      {
        id: "vehicles",
        q: "What vehicles can I choose from?",
        a: [
          "Six classes, from a Saloon Car for up to 3 passengers with 2 suitcases, through Executive and Estate cars, 4- and 6-seat MPVs, up to an 8-seat Minibus for larger groups.",
          "Each option on the Pick your vehicle step shows its passenger and luggage capacity plus its price for your exact route, so you can compare before choosing.",
        ],
      },
      {
        id: "stops-addons-return",
        q: "Can I add extra stops, add-ons, or a return trip?",
        a: [
          "Yes. On the Trip step you can add up to 3 extra stops along your route. On the Details step you can select optional add-ons (for example a child seat or meet & greet) and add a return trip in the same booking, often at a discount.",
        ],
      },
    ],
  },
  {
    id: "airport",
    title: "Airport pickup & flight tracking",
    items: [
      {
        id: "flight-tracking",
        q: "Do you track my flight?",
        a: [
          "Yes — add your flight number when you book and we monitor it, adjusting your driver's pickup automatically if your flight is early or delayed, at no extra charge.",
          "For airport arrivals with a correct flight number, you get 45 minutes of free waiting time from the actual landing time. Pickups from any other location get 15 minutes of free waiting from the scheduled time.",
        ],
      },
      {
        id: "meet-driver",
        q: "Where will my driver meet me?",
        a: [
          "For airport arrivals, your driver meets you at the terminal's designated meeting point once you've cleared arrivals — the exact spot is confirmed in your booking details. For other pickups, they'll be waiting at the address you provided from the scheduled time.",
        ],
      },
    ],
  },
  {
    id: "payment",
    title: "Payment & promotions",
    items: [
      {
        id: "payment-methods",
        q: "What payment methods do you accept?",
        a: [
          "Choose either option on the Review step: pay securely by card through Stripe's checkout, or pay your driver in cash at the end of the trip.",
        ],
      },
      {
        id: "promo-codes",
        q: "Do you offer promo codes or discounts?",
        a: [
          "If you have a promo code, enter it in the trip summary before you pay and it's applied instantly. When a site-wide promotion is running, it's applied automatically and shown as a banner with the discounted price — no code needed.",
        ],
      },
    ],
  },
  {
    id: "managing",
    title: "Managing your booking",
    items: [
      {
        id: "track-status",
        q: "How do I check my booking status?",
        a: [
          "Use Track Booking with your reference number, or the direct link in your confirmation email. Status shows as Pending payment, Confirmed, Driver assigned, Completed, or Cancelled.",
        ],
      },
      {
        id: "change-cancel",
        q: "Can I change or cancel my booking online?",
        a: [
          "Tracking a booking shows its live details, but changes and cancellations are handled by our team rather than self-service on the site — contact us with your reference and we'll take care of it.",
        ],
      },
      {
        id: "cancellation-fee",
        q: "Is there a cancellation fee?",
        a: [
          "Cancel more than 6 hours before your scheduled pickup and you're refunded in full, minus a 5% payment-gateway processing fee. Cancelling within the final 6 hours, or not showing up, is non-refundable, since a driver has typically already been allocated.",
          "If we cancel, or the service isn't provided due to our fault, you get a full refund with no processing fee deducted. See our Terms for the full policy.",
        ],
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        id: "contact-support",
        q: "How do I contact support?",
        a: [
          "WhatsApp, phone, or email — see our Contact page for the details, or use the help button in the bottom corner of any page. Our team is available 24/7 for questions before, during, or after your trip.",
        ],
      },
    ],
  },
]
