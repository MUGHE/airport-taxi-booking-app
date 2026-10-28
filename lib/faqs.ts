// The site FAQs, grouped by topic: shown on /help after the Help Centre topics, and as one list on the homepage.
import { CALL_NUMBER, WHATSAPP_NUMBER } from "@/lib/contact"

const CALL_DISPLAY = CALL_NUMBER
const WHATSAPP_DISPLAY = `+${WHATSAPP_NUMBER.replace(/^\+/, "")}`

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

export const FAQ_PAGE_CATEGORIES: FaqCategory[] = [
  {
    id: "booking",
    title: "Booking & Payment",
    items: [
      {
        id: "how-to-book",
        q: "How can I make a booking?",
        a: [
          `You can book in three ways: use our online booking form, message us on WhatsApp at ${WHATSAPP_DISPLAY}, or call ${CALL_DISPLAY}. Enter your pickup and drop-off details and follow the steps provided.`,
          "Online, you see a fixed price for every vehicle class before choosing one, and no account is needed. Your booking reference is emailed to you as soon as you confirm.",
        ],
      },
      {
        id: "book-by-phone",
        q: "Can I book by phone?",
        a: [`Yes. Call us anytime on ${CALL_DISPLAY}. Our control team is available 24/7.`],
      },
      {
        id: "return-journey",
        q: "Can I book a return journey?",
        a: [
          "Yes. You can book a one-way or return trip in a single booking, or add the return journey later.",
          "Booked together, the return leg is added on the Details step and is often discounted.",
        ],
      },
      {
        id: "payment-methods",
        q: "How can I pay for my booking?",
        a: [
          "We accept Visa, MasterCard, American Express and cash to the driver. You can pay in full in cash for airport pickups. For home pickups paid in cash, a deposit may be required. Contact our office for the applicable amount.",
        ],
      },
      {
        id: "confirmation",
        q: "How will I receive my booking confirmation?",
        a: ["You'll receive a confirmation by email, or via WhatsApp if you prefer."],
      },
    ],
  },
  {
    id: "airport",
    title: "Airport & Flight Related",
    items: [
      {
        id: "flight-delayed",
        q: "Will I be charged extra if my flight is delayed?",
        a: [
          "No. We track every flight and dispatch your driver based on the actual arrival time, with no extra cost for delays. Just add your flight number when you book. Changes requested by you at short notice may incur an additional charge. Contact our team to discuss.",
        ],
      },
      {
        id: "waiting-time",
        q: "Do you provide extra waiting time?",
        a: [
          "Airport pickups include 60 minutes of free waiting from the actual flight landing time. After that, waiting is charged at £15 per 30 minutes.",
        ],
      },
      {
        id: "find-driver",
        q: "How do I find my driver at the airport?",
        a: [
          "Your driver will call or text you after you land. If you've booked Meet & Greet, your driver will be waiting inside the arrivals hall holding a name board.",
        ],
      },
      {
        id: "meet-and-greet",
        q: "Do you offer a Meet & Greet service?",
        a: [
          "Yes. Optional Meet & Greet costs £7 extra. Your driver meets you inside arrivals with a name board and helps with your luggage.",
        ],
      },
    ],
  },
  {
    id: "vehicles",
    title: "Vehicles & Services",
    items: [
      {
        id: "vehicle-types",
        q: "What vehicle types do you offer?",
        a: [
          "We offer six classes to suit all group sizes: Saloon Car (up to 4 passengers, 2 suitcases), Executive E-Class (up to 3 passengers, 2 suitcases), Estate Car (up to 4 passengers, 3 suitcases), 4 Seater MPV (up to 4 passengers, 4 suitcases), 6 Seater MPV (up to 5 passengers with 5 suitcases, or 6 with hand luggage only) and 8 Seater Minibus (up to 8 passengers, 8 suitcases).",
        ],
      },
      {
        id: "choose-vehicle",
        q: "How do I choose the right vehicle for my group?",
        a: [
          "Each vehicle listing shows its passenger and luggage capacity. If you're unsure, book a larger vehicle or contact us for advice.",
        ],
      },
      {
        id: "luggage",
        q: "How much luggage can each vehicle carry?",
        a: [
          "Luggage capacity is shown for every vehicle type on our site. If you're carrying extra bags, please book a larger vehicle.",
        ],
      },
      {
        id: "child-seats",
        q: "Are child seats available?",
        a: ["Yes. Child seats are free of charge on request, subject to availability."],
      },
      {
        id: "mpv-passengers",
        q: "How many passengers can an MPV carry?",
        a: ["Our MPVs carry up to 8 passengers. For larger groups, we can arrange multiple vehicles."],
      },
    ],
  },
  {
    id: "policies",
    title: "Policies & Other",
    items: [
      {
        id: "licensed",
        q: "Are you a licensed operator?",
        a: ["Yes. We are a fully licensed Private Hire Operator under UK regulations."],
      },
      {
        id: "smoking",
        q: "Is smoking allowed in your vehicles?",
        a: ["No. Smoking and vaping are strictly prohibited under UK law."],
      },
      {
        id: "hours",
        q: "What are your operating hours?",
        a: ["We operate 24 hours a day, 7 days a week, including public holidays."],
      },
      {
        id: "fare-includes",
        q: "What's included in the fare?",
        a: [
          "Your quoted fare includes airport pickup and drop-off charges, tolls, parking and congestion charges. Optional Meet & Greet costs £7 extra, and additional waiting costs £15 per 30 minutes after the free airport waiting allowance. Changes requested by you may also affect the fare. Please see our terms and conditions.",
        ],
      },
      {
        id: "insurance",
        q: "Are your vehicles fully insured?",
        a: ["Yes. All vehicles are insured for hire and reward and include full passenger liability cover."],
      },
      {
        id: "flight-cancelled",
        q: "What happens if my flight is cancelled?",
        a: ["Please notify us immediately. We'll reschedule your transfer or issue a refund in line with our policy."],
      },
      {
        id: "cancellation-policy",
        q: "What is your cancellation policy?",
        a: [
          "If you wish to cancel your booking, you must notify us as soon as possible. Cancellations made more than 6 hours before the scheduled pickup time will be refunded, with only the 5% payment gateway processing fee deducted from the refund amount.",
          "Cancellations within 6 hours of pickup, and no-shows, are non-refundable, as a driver has usually been allocated by then. If we cancel, or the service isn't provided through our fault, you get a full refund with no fee deducted. Our Terms set out the full policy.",
        ],
      },
      {
        id: "phone-on",
        q: "Do I need to keep my phone on during pickup?",
        a: ["Yes. Please keep your phone switched on so your driver can contact you on arrival."],
      },
      {
        id: "coverage",
        q: "Which areas do you cover?",
        a: ["We provide transfers across the UK nationwide, including all major airports and cities."],
      },
      {
        id: "pets",
        q: "Can I bring my pet?",
        a: ["Pets are not permitted unless pre-approved. Guide dogs and service dogs are always welcome."],
      },
    ],
  },
]
