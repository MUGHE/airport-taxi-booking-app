"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { FAQ_PAGE_CATEGORIES } from "@/lib/faqs"

// The FAQs live in lib/faqs.ts, grouped by topic for /faqs. Here they sit behind topic pills,
// with long lists cut to the first few questions until "Show all" is pressed.
type Faq = { id: string; q: string; a: string }

const toFaq = (item: { id: string; q: string; a: string[] }): Faq => ({ id: item.id, q: item.q, a: item.a.join(" ") })

// Shorter pill labels than the /faqs section titles.
const PILL_LABELS: Record<string, string> = {
  booking: "Booking & Payment",
  airport: "Airport & Delays",
  vehicles: "Vehicles & Luggage",
  policies: "Policies",
}

const TABS: { id: string; label: string; items: Faq[] }[] = [
  { id: "all", label: "All", items: FAQ_PAGE_CATEGORIES.flatMap((c) => c.items).map(toFaq) },
  ...FAQ_PAGE_CATEGORIES.map((c) => ({ id: c.id, label: PILL_LABELS[c.id] ?? c.title, items: c.items.map(toFaq) })),
]

// Eight cards fill four rows of the two-column grid.
const INITIAL_COUNT = 8

export function FAQ() {
  const [tabId, setTabId] = useState("all")
  const [expanded, setExpanded] = useState(false)

  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0]
  const canCollapse = tab.items.length > INITIAL_COUNT
  const visible = expanded || !canCollapse ? tab.items : tab.items.slice(0, INITIAL_COUNT)

  return (
    <section className="landing-faq">
      <div className="landing-container">
        <div className="landing-faq-heading">
          <div>
            <span className="landing-eyebrow">FAQs</span>
            <h2>Questions, answered.</h2>
            <p>Still deciding? Here&apos;s what most travellers ask before they book.</p>
          </div>
          <Link href="/faqs">See all FAQs <ArrowRight aria-hidden="true" /></Link>
        </div>

        <div className="landing-faq-tabs" role="group" aria-label="Filter questions by topic">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === tab.id}
              onClick={() => {
                setTabId(t.id)
                setExpanded(false)
              }}
            >
              {t.label}
              <span aria-hidden="true">{t.items.length}</span>
            </button>
          ))}
        </div>

        {/* Keyed by topic so open cards close when the topic changes. */}
        <Accordion key={tab.id} className="landing-faq-list" id="landing-faq-list">
          {visible.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionPanel>{item.a}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        {canCollapse && (
          <div className="landing-faq-more">
            <button type="button" aria-expanded={expanded} aria-controls="landing-faq-list" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : `Show all ${tab.items.length} FAQs`}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
