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
    <section className="mx-auto max-w-3xl px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          Good to know
        </span>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
      </div>

      <Accordion className="mt-10 rounded-2xl border border-border bg-card px-5">
        {FAQS.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionPanel className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
