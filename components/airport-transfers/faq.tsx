import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"

export const AIRPORT_TRANSFER_FAQS = [
  {
    q: "How does flight tracking work?",
    a: "Add your flight number when you book and we monitor it, adjusting your driver's pickup automatically if your flight is early or delayed, at no extra charge.",
  },
  {
    q: "Where will I meet my driver?",
    a: "For airport arrivals, your driver meets you at the terminal's designated meeting point once you've cleared arrivals. The exact spot is confirmed in your booking details.",
  },
  {
    q: "Can I book a child seat?",
    a: "Child seats are available on request. Add a note when you book and our team will arrange the appropriate seat for your journey.",
  },
  {
    q: "Can I change my booking?",
    a: "Changes and cancellations are handled by our team rather than self-service on the site. Contact us with your booking reference and we will help.",
  },
] as const

export function AirportTransferFaq() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: AIRPORT_TRANSFER_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 lg:pb-24">
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        Airport transfer questions, answered
      </h2>
      <Accordion className="mt-8 grid gap-3 sm:grid-cols-2">
        {AIRPORT_TRANSFER_FAQS.map((item, index) => (
          <AccordionItem key={item.q} value={`airport-faq-${index}`} className="rounded-xl border bg-card px-4">
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionPanel className="text-muted-foreground">{item.a}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </section>
  )
}
