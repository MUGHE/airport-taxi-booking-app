"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Category tabs for /faqs: a sticky sidebar on wide screens, a wrapping row of chips on smaller ones.
// The tab for the section currently in view is highlighted.
export function FaqCategoryNav({ categories }: { categories: { id: string; title: string }[] }) {
  const [active, setActive] = useState(categories[0]?.id)

  useEffect(() => {
    const sections = categories.map((category) => document.getElementById(category.id)).filter((el): el is HTMLElement => !!el)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-20% 0px -60% 0px" },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [categories])

  return (
    <nav aria-label="FAQ categories">
      <p className="mb-3 hidden text-xs font-bold uppercase tracking-[.16em] text-muted-foreground xl:block">Categories</p>
      <ul className="flex flex-wrap gap-2 xl:flex-col xl:gap-1">
        {categories.map((category) => (
          <li key={category.id}>
            <a
              href={`#${category.id}`}
              onClick={() => setActive(category.id)}
              aria-current={active === category.id ? "true" : undefined}
              className={cn(
                "block rounded-full border px-4 py-2 text-sm font-medium transition-colors xl:rounded-lg xl:border-transparent xl:px-3",
                active === category.id
                  ? "border-primary bg-primary text-primary-foreground xl:border-transparent xl:bg-primary/10 xl:text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground xl:bg-transparent xl:hover:bg-secondary",
              )}
            >
              {category.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
