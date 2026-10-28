import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import type { FaqCategory } from "@/lib/faqs"

// One FAQ category: its heading and an accordion of questions. `id` is the scroll target the
// category nav links to; `itemIdPrefix` gives each question an id too, so other links can open it.
export function FaqCategorySection({ category, id = category.id, itemIdPrefix }: { category: FaqCategory; id?: string; itemIdPrefix?: string }) {
  return (
    <section id={id} className="scroll-mt-24" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">{category.title}</h2>
      <Accordion className="mt-4 rounded-2xl border border-border bg-card px-5" multiple>
        {category.items.map((item) => (
          <AccordionItem key={item.id} value={item.id} id={itemIdPrefix ? `${itemIdPrefix}${item.id}` : undefined} className="scroll-mt-24">
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
