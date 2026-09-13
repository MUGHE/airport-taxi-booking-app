"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AdminDestinationPage } from "@/lib/admin-destination-pages"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function DestinationPagesList({ pages }: { pages: AdminDestinationPage[] }) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")
  const [featured, setFeatured] = useState("all")
  const filtered = useMemo(() => pages.filter((page) => {
    const textMatch = `${page.displayName} ${page.officialName} ${page.slug}`.toLowerCase().includes(query.toLowerCase().trim())
    return textMatch && (type === "all" || page.pageType === type) && (status === "all" || page.lifecycleState === status) && (featured === "all" || String(page.featured) === featured)
  }), [featured, pages, query, status, type])

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-xl border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <Input aria-label="Search Destination Pages" placeholder="Search airport name or slug" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter by page type" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All page types</option><option value="airport">Airport Page</option><option value="city_town">City and Town Page</option>
        </select>
        <select aria-label="Filter by status" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
        <select aria-label="Filter by featured state" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={featured} onChange={(event) => setFeatured(event.target.value)}>
          <option value="all">Featured: all</option><option value="true">Featured</option><option value="false">Not featured</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Display name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Unpublished changes</th><th className="px-4 py-3">Last updated</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((page) => <tr key={page.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium"><Link className="hover:underline" href={`/admin/destination-pages/${page.id}`}>{page.displayName}</Link></td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{page.slug}</td>
              <td className="px-4 py-3">{page.pageType === "airport" ? "Airport Page" : "City and Town Page"}</td>
              <td className="px-4 py-3"><Badge variant={page.lifecycleState === "published" ? "default" : "secondary"}>{page.lifecycleState}</Badge></td>
              <td className="px-4 py-3">{page.featured ? "Yes" : "No"}</td>
              <td className="px-4 py-3">{page.hasUnpublishedChanges ? <Badge variant="destructive">Yes</Badge> : "No"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(page.updatedAt)}</td>
            </tr>)}
            {!filtered.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No Destination Pages match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
