import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import type { FaqCategory } from "@/lib/faqs"

// One FAQ category: its heading and an accordion of questions. `id` is the scroll target the
// category nav links to, so pages showing two FAQ sets can keep their ids apart.
export function FaqCategorySection({ category, id = category.id }: { category: FaqCategory; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">{category.title}</h2>
      <Accordion className="mt-4 rounded-2xl border border-border bg-card px-5" multiple>
        {category.items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionPanel>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {item.a.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
