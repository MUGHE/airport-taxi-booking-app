import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Do you track my flight?",
    a: "Yes — every airport pickup includes free flight tracking, so your driver adjusts automatically if your flight is early or delayed.",
  },
  {
    q: "Can I book a return journey?",
    a: "Yes. Add a return leg to the same booking on the Details step, often at a discount.",
  },
  {
    q: "Is there a waiting time at the airport?",
    a: "Yes — generous free waiting time is included with every airport pickup, so a slow arrivals queue won't cost you extra.",
  },
  {
    q: "Are child seats available?",
    a: "Yes, child seats are available on request — just add a note when you book and we'll have one ready.",
  },
]

export function FAQ() {
  return (
    <section className="landing-faq">
      <div className="landing-container landing-faq-grid">
      <div className="landing-faq-heading">
        <span className="landing-eyebrow">Good to know</span>
        <h2>A little clarity before you travel.</h2>
        <p>Everything you need for a smooth airport pickup, answered simply.</p>
        <Link href="/help">Visit the help centre <ArrowRight aria-hidden="true" /></Link>
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
