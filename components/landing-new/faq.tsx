import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"

// Facts here mirror the Terms (lib/terms-content.ts) and Help Centre (lib/help-content.ts);
// update them together.
const FAQS = [
  {
    q: "Do you track my flight?",
    a: "Yes. Add your flight number when you book and we monitor it live, so your driver arrives when you actually land, even if you're early or late. There's no extra charge for delays.",
  },
  {
    q: "How long will my driver wait?",
    a: "Airport pickups include 60 minutes of free waiting from when your flight actually lands, as long as you give us your flight number. Other pickups include 15 minutes from the scheduled time.",
  },
  {
    q: "Where will I meet my driver?",
    a: "Your driver meets you at the terminal's meeting point once you've cleared arrivals, and the exact spot is in your booking details. Prefer to be met inside the arrivals hall? Add meet & greet when you book.",
  },
  {
    q: "Is the price really fixed?",
    a: "Yes. Your fare is confirmed before you pay and there's no surge pricing. It only changes if your journey changes, such as adding a stop.",
  },
  {
    q: "Can I book a return journey?",
    a: "Yes. Add your return on the Details step and both trips are confirmed together, often at a discount.",
  },
  {
    q: "Are child seats available?",
    a: "Yes. Add a child seat as an extra when you book and it'll be fitted before pickup.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Yes. Contact us with your booking reference. Cancel more than 6 hours before pickup for a refund, minus a 5% payment processing fee; cancellations within 6 hours are non-refundable.",
  },
]

export function FAQ() {
  return (
    <section className="landing-faq">
      <div className="landing-container landing-faq-grid">
      <div className="landing-faq-heading">
        <span className="landing-eyebrow">FAQs</span>
        <h2>Questions, answered.</h2>
        <p>Still deciding? Here&apos;s what most travellers ask before they book.</p>
        <Link href="/help">More answers in our Help Centre <ArrowRight aria-hidden="true" /></Link>
      </div>

      <Accordion className="landing-faq-list">
        {FAQS.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionPanel>
              {item.a}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
    </section>
  )
}
