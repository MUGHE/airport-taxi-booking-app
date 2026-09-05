import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_NOTICE,
  TERMS_SECTIONS,
  TERMS_SUBTITLE,
  TERMS_TITLE,
  type TermsBlock,
} from "@/lib/terms-content"

export const metadata: Metadata = {
  title: TERMS_TITLE,
  description: `${TERMS_SUBTITLE}. Booking, cancellation, fare, and passenger terms for ONE Airport Taxi.`,
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: TERMS_TITLE }]} />
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">{TERMS_TITLE}</h1>
            <p className="mt-2 text-muted-foreground">
              {TERMS_SUBTITLE} &middot; Effective {TERMS_EFFECTIVE_DATE}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm">
            <p>
              <span className="font-semibold">Important: </span>
              {TERMS_NOTICE}
            </p>
          </div>

          <nav aria-label="Sections" className="mt-8 rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold">On this page</p>
            <ol className="grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {TERMS_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="transition-colors hover:text-foreground">
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 divide-y divide-border">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20 py-8 first:pt-0">
                <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                  {section.body.map((block, i) => (
                    <TermsBlockView key={i} block={block} />
                  ))}
                  {section.id === "contact" && (
                    <p>
                      <Link href="/contact" className="font-medium text-primary hover:underline">
                        View our contact details →
                      </Link>
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function TermsBlockView({ block }: { block: TermsBlock }) {
  if (block.type === "p") {
    return <p>{block.text}</p>
  }

  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr className="bg-secondary/50">
            {block.headers.map((header) => (
              <th
                key={header}
                className="border-b border-border px-4 py-2.5 text-xs font-semibold tracking-wide text-foreground uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {block.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
