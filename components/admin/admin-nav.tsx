"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ADMIN_TABS, type AdminSection } from "@/lib/admin-roles"

export function AdminNav({ sections }: { sections: AdminSection[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {ADMIN_TABS.filter((tab) => sections.includes(tab.section)).map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
