import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { FAQ_CATEGORIES } from "@/lib/help-content"

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Answers to the most common questions about booking, fares, flight tracking, payment, and managing your ONE Airport Taxi booking.",
  alternates: { canonical: "/help" },
}

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Help Center</h1>
            <p className="mt-2 text-muted-foreground">
              Answers to the questions we hear most, based on exactly how booking with
              us works.
            </p>
          </div>

          <nav aria-label="Categories" className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold">On this page</p>
            <ol className="grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {FAQ_CATEGORIES.map((category) => (
                <li key={category.id}>
                  <a href={`#${category.id}`} className="transition-colors hover:text-foreground">
                    {category.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {FAQ_CATEGORIES.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-20">
                <h2 className="text-xl font-semibold tracking-tight">{category.title}</h2>
                <Accordion className="mt-3 rounded-2xl border border-border bg-card px-5">
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
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? Our team is glad to help &mdash;{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              get in touch
            </Link>
            , or{" "}
            <Link href="/track" className="font-medium text-primary hover:underline">
              track an existing booking
            </Link>
            .
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
