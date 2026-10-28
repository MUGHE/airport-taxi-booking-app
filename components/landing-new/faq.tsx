import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { FAQ_PAGE_CATEGORIES } from "@/lib/faqs"

// The FAQs live in lib/faqs.ts, grouped by topic for /faqs; shown here as one list.
const FAQS = FAQ_PAGE_CATEGORIES.flatMap((category) => category.items).map((item) => ({ q: item.q, a: item.a.join(" ") }))

export function FAQ() {
  return (
    <section className="landing-faq">
      <div className="landing-container landing-faq-grid">
      <div className="landing-faq-heading">
        <span className="landing-eyebrow">FAQs</span>
        <h2>Questions, answered.</h2>
        <p>Still deciding? Here&apos;s what most travellers ask before they book.</p>
        <Link href="/faqs">See all FAQs <ArrowRight aria-hidden="true" /></Link>
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
