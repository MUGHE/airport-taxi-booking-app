import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SITE_URL } from "@/lib/site"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  /** Omit on the current page — it renders as plain text instead of a link. */
  href?: string
}

/**
 * Accessible breadcrumb trail plus its matching BreadcrumbList JSON-LD, so pages
 * one level below the homepage (About, Contact, Book, etc.) both look navigable
 * and can show a breadcrumb rich result in search. Not meant for the homepage
 * itself, which has no parent to show.
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <li key={item.label} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
                )}
                {item.href && !isLast ? (
                  <Link href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="font-medium text-foreground">
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  )
}
