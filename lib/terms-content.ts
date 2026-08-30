// Structured content for the Terms & Conditions page (app/terms/page.tsx),
// sourced from the "Booking Terms and Conditions" document supplied by the
// business. Keep this in sync if that document is revised.

export type TermsBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: [string, string]; rows: [string, string][] }

export type TermsSection = {
  id: string
  heading: string
  body: TermsBlock[]
}

export const TERMS_TITLE = "Booking Terms and Conditions"
export const TERMS_SUBTITLE = "UK private-hire and airport transfer services"
export const TERMS_EFFECTIVE_DATE = "25 August 2026"
export const TERMS_NOTICE =
  "These terms form the agreement for your journey. Please read the cancellation, airport waiting-time, fare, and passenger-responsibility clauses carefully."

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "about",
    heading: "1. About these terms",
    body: [
      {
        type: "p",
        text: 'These terms apply when you book a journey through OneAirportTaxi.com ("we", "us", "our" or "One Airport Taxi"). They apply to the person making the booking and to every passenger travelling under it (together, "you").',
      },
      {
        type: "p",
        text: "The legal business name, registered address, company number (if applicable), private-hire operator licence details, contact email, and telephone number listed on our website or in your booking confirmation form part of these terms. We provide pre-booked private-hire and airport transfer services in the United Kingdom, either directly or through licensed transport providers.",
      },
      {
        type: "p",
        text: "If a booking confirmation, quote or service-specific notice differs from these terms, that document applies only to the extent of the difference. Nothing in these terms limits rights that cannot lawfully be excluded.",
      },
    ],
  },
  {
    id: "booking",
    heading: "2. Booking, quotation and contract",
    body: [
      {
        type: "p",
        text: "A quote is an estimate based on the journey details you provide. Your booking is confirmed only when you receive a booking confirmation with a reference number. Please review it promptly and notify us of any errors immediately.",
      },
      {
        type: "p",
        text: "Please provide accurate pick-up and destination addresses, dates and times, passenger and luggage numbers, contact details, flight number for airport collections, and any accessibility, child-seat, or special requirements. You are responsible for the booking and all passengers included.",
      },
      {
        type: "p",
        text: "We may refuse, cancel, or amend a booking if information is incomplete or inaccurate, the vehicle is unsuitable, payment cannot be authorised, safety or legal requirements prevent the journey, or there is suspected fraud or abusive conduct. Where possible, we will explain the reason and refund any payments if we cannot provide the service and you are not at fault.",
      },
    ],
  },
  {
    id: "fares",
    heading: "3. Fares, payment and extras",
    body: [
      {
        type: "p",
        text: "The confirmed fare applies only to the journey described in your confirmation. Unless specifically stated, charges for airport or station drop-off or pick-up, tolls, congestion or clean-air zones, parking, extra waiting time, diversions, additional stops, cleaning, damage, or vehicle upgrades are not included.",
      },
      {
        type: "p",
        text: "We may collect full payment, a deposit, or a payment card authorisation at the time of booking. For pay-on-arrival bookings, you must pay the driver using the agreed method before the journey ends. The cardholder must be authorised to use the provided payment method.",
      },
      {
        type: "p",
        text: "You are responsible for any extra charges resulting from requested changes or incorrect booking details. Where possible, we will seek your agreement before applying additional charges. Card payments are processed through our payment gateway, and your bank or card issuer may apply its own fees.",
      },
    ],
  },
  {
    id: "cancellation",
    heading: "4. Changes, cancellation and refunds",
    body: [
      {
        type: "p",
        text: "To cancel or amend your booking, use the management link in your confirmation email or contact us using the details provided. Cancellations are valid only once we confirm them. Informing the driver does not cancel your booking.",
      },
      {
        type: "table",
        headers: ["Cancellation circumstance", "Applicable policy"],
        rows: [
          [
            "More than 6 hours before your scheduled pickup time",
            "If you wish to cancel your booking, you must notify us as soon as possible. Cancellations made more than 6 hours before the scheduled pickup time will be refunded, with only the 5% payment gateway processing fee deducted from the refund amount.",
          ],
          [
            "Within the final 6 hours before your scheduled pickup time",
            "Cancellations made within the final 6 hours before the scheduled pickup time are non-refundable, as resources may already have been allocated to your booking.",
          ],
          [
            "You do not show up for your booking",
            "The booking will be treated as a no-show and will be non-refundable.",
          ],
          [
            "We cancel, the driver does not provide the service, or the service is not provided due to our fault",
            "We will offer a reasonable alternative where possible, or refund the full amount paid for the unprovided journey. No payment-gateway processing charge will be deducted.",
          ],
        ],
      },
      {
        type: "p",
        text: "For a customer cancellation or change of mind, we may deduct a 5% payment-gateway processing charge from the refund, only where this is permitted by law. We do not deduct this charge where we, the driver or a transport provider fail to provide the booked service. Refunds are made to the original payment method within 5 business days after cancellation is confirmed; your bank may take longer to credit the funds.",
      },
      {
        type: "p",
        text: "A change is subject to availability and may change the fare. A request made less than 6 hours before pick-up may be treated as a late cancellation and new booking. We will explain any cancellation charge on request and will not apply one where doing so would be unlawful or unfair in the circumstances.",
      },
    ],
  },
  {
    id: "waiting-time",
    heading: "5. Pick-up times and waiting time",
    body: [
      {
        type: "p",
        text: "Please be ready at the agreed pick-up point and keep your phone on. The following waiting periods are included:",
      },
      {
        type: "list",
        items: [
          "Pick-ups from homes, apartments, offices, hotels, stations and any other non-airport location (including departures to an airport): 15 minutes free from the scheduled pick-up time.",
          "Airport arrivals: 45 minutes free from the actual flight landing time, provided you supplied a correct flight number and we accepted it in the confirmation.",
        ],
      },
      {
        type: "p",
        text: "For airport arrivals, the driver will usually meet you at the stated meeting point or designated pick-up area. Airport parking rules may limit waiting locations, so please follow the instructions in your confirmation or from the driver. If you cannot locate the driver, contact the driver or us promptly using the details provided in your confirmation.",
      },
      {
        type: "p",
        text: "After the free waiting period, additional charges for waiting time, parking, and airport access may apply. We will inform you of any charges where possible. If you do not arrive, cannot be contacted, or do not meet the driver within the free period, the driver may consider the booking a no-show and leave. In this case, no refund will be issued.",
      },
      {
        type: "p",
        text: "We track flights only if you provide a correct flight number. If you supply an incorrect or incomplete flight number, or if your flight details change, you must inform us as soon as possible. In these cases, we may not be able to track your flight or offer the 45-minute airport arrival waiting period. You will be responsible for any additional waiting, parking, dispatch, or rebooking costs resulting from incorrect information.",
      },
      {
        type: "p",
        text: "We are not responsible for delays, diversions, cancellations, baggage delays, immigration delays, or missed connections. If a flight delay or change affects your booking, please contact us as soon as possible. Any alternative arrangements depend on vehicle availability and may incur revised charges.",
      },
    ],
  },
  {
    id: "passenger-safety",
    heading: "6. Passenger, luggage and safety requirements",
    body: [
      {
        type: "p",
        text: "Please book a vehicle that accommodates all passengers, luggage, and any special items. Standard luggage includes ordinary suitcases and hand luggage. You must declare any oversized, excessive, fragile, or unusual items, such as sports equipment, prams, wheelchairs, pets, or musical instruments, before booking. We may refuse carriage if an item is unsafe, illegal, cannot be transported securely, or was not declared.",
      },
      {
        type: "p",
        text: "Children must use appropriate child restraint as required by law. You are responsible for requesting the restraint in advance and ensuring it is suitable. All passengers must wear seat belts where available and follow the driver's reasonable safety instructions.",
      },
      {
        type: "p",
        text: "Smoking, vaping, alcohol consumption, illegal drugs, weapons, dangerous goods, harassment, violence, threatening behaviour, and damage are not permitted in the vehicle. We may end the journey or refuse carriage if required for safety or legal reasons. You are responsible for reasonable cleaning, repair, downtime, fines, and other direct costs resulting from a passenger's actions.",
      },
    ],
  },
  {
    id: "route-changes",
    heading: "7. Route, journey changes and delays",
    body: [
      {
        type: "p",
        text: "The driver may choose a reasonable route, taking into account traffic, road conditions, safety, and legal restrictions. Journey times are estimates only and are not guaranteed. Allow sufficient time for flights, check-in, security, events and weather.",
      },
      {
        type: "p",
        text: "Additional stops, a change of destination, a return journey, or a material change to passenger/luggage requirements must be agreed with the driver or us and may incur an additional fare. The driver may refuse a change that is unsafe, unlawful, unavailable or would cause unreasonable disruption to other commitments.",
      },
    ],
  },
  {
    id: "accessibility",
    heading: "8. Accessibility and assistance",
    body: [
      {
        type: "p",
        text: "Please inform us of any accessibility or mobility needs when booking, so we can determine if a suitable vehicle and assistance are available. We will not charge extra for a disability or mobility aid where prohibited by law. Some requests may require advance notice, and accessible vehicles are subject to availability.",
      },
      {
        type: "p",
        text: "Drivers may provide reasonable assistance within the limits of their training, insurance, and safety requirements. They are not required to lift passengers or handle equipment if it would be unsafe.",
      },
    ],
  },
  {
    id: "liability",
    heading: "9. Our service standards and liability",
    body: [
      {
        type: "p",
        text: "We will exercise reasonable care and skill when arranging and providing your booked journey. We are not responsible for losses resulting from inaccurate information, passenger delays, third parties, traffic, road closures, severe weather, police or airport restrictions, strikes, emergencies, or other events beyond our reasonable control, unless such loss results from our failure to use reasonable care and skill.",
      },
      {
        type: "p",
        text: "Nothing excludes or limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, failure to provide services with reasonable care and skill, or any liability that cannot lawfully be excluded. Your statutory consumer rights remain unaffected.",
      },
      {
        type: "p",
        text: "You are responsible for your personal belongings. If you leave property in a vehicle, please contact us promptly with your booking reference and a description of the item. We will make reasonable efforts to locate it, but cannot guarantee recovery and may charge reasonable delivery or storage fees.",
      },
    ],
  },
  {
    id: "complaints",
    heading: "10. Complaints, refunds and chargebacks",
    body: [
      {
        type: "p",
        text: "Please report any service issue as soon as possible, and no later than 7 days after your journey, using the contact details on our website or confirmation. Provide your booking reference, journey date, a description of the issue, and any supporting evidence. We aim to acknowledge complaints within 5 business days and will investigate each case fairly.",
      },
      {
        type: "p",
        text: "Please do not initiate a payment dispute or chargeback for issues we can reasonably investigate first, unless you have a valid legal or card-scheme reason. This does not affect your legal right to dispute a charge with your card issuer.",
      },
    ],
  },
  {
    id: "data-protection",
    heading: "11. Data protection and communications",
    body: [
      {
        type: "p",
        text: "We use personal information to manage bookings, process payments, communicate about your journey, fulfil legal requirements, prevent fraud, and enhance our services. We may share relevant details with drivers, transport providers, payment processors, insurers, regulators, and service providers. Our Privacy Policy outlines the specific purposes, legal bases, retention periods, and your rights.",
      },
      {
        type: "p",
        text: "Booking confirmations and essential service messages are considered transactional communications. Marketing communications are sent only as permitted by law and in accordance with your preferences.",
      },
    ],
  },
  {
    id: "general-legal",
    heading: "12. General legal terms",
    body: [
      {
        type: "p",
        text: "The law of England and Wales governs these terms. The courts of England and Wales have jurisdiction, except that consumers resident elsewhere in the United Kingdom may have mandatory protections and may bring proceedings as permitted by applicable law.",
      },
      {
        type: "p",
        text: "If any term is found invalid or unenforceable, the remaining terms will remain in effect. We may update these terms for future bookings. The version accepted at the time of booking will apply unless a change is required by law or is clearly more favourable to you.",
      },
      {
        type: "p",
        text: "These terms do not remove your rights under the Consumer Rights Act 2015 or other applicable consumer-protection law. Passenger transport bookings for a specified time may not carry the standard 14-day cancellation right, but the voluntary cancellation policy in clause 4 applies as stated.",
      },
    ],
  },
  {
    id: "contact",
    heading: "13. Contact",
    body: [
      {
        type: "p",
        text: "For bookings, changes, cancellations, or complaints, please refer to the contact details and booking management link provided in your confirmation or on OneAirportTaxi.com.",
      },
    ],
  },
]
