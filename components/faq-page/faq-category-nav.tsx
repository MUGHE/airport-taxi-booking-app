"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

type NavGroup = { title: string; categories: { id: string; title: string }[] }

// Category tabs for /faqs: a sticky sidebar on wide screens, a wrapping row of chips on smaller ones.
// The tab for the section currently in view is highlighted.
export function FaqCategoryNav({ groups }: { groups: NavGroup[] }) {
  const categories = useMemo(() => groups.flatMap((group) => group.categories), [groups])
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
    <nav aria-label="Page sections" className="space-y-4 xl:space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground xl:mb-3">{group.title}</p>
          <ul className="flex flex-wrap gap-2 xl:flex-col xl:gap-1">
            {group.categories.map((category) => (
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
        </div>
      ))}
    </nav>
  )
}
