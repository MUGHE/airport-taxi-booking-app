"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { bulkPublishPlaceDraftsAction, reviewBulkPlacePublishAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminDestinationPage } from "@/lib/admin-destination-pages"
import { getDestinationPagePolicy } from "@/lib/destination-page-policy"
import type { BulkPublishReportItem, PublishReview } from "@/lib/admin-destination-pages"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function DestinationPagesList({ pages }: { pages: AdminDestinationPage[] }) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")
  const [attention, setAttention] = useState("all")
  const filtered = useMemo(() => pages.filter((page) => {
    const textMatch = `${page.displayName} ${page.officialName} ${page.slug}`.toLowerCase().includes(query.toLowerCase().trim())
    const needsAttention = page.lifecycleState === "draft" || page.hasUnpublishedChanges
    return textMatch && (type === "all" || page.pageType === type) && (status === "all" || page.lifecycleState === status) && (attention === "all" || String(needsAttention) === attention)
  }), [attention, pages, query, status, type])
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([])
  const [reviews, setReviews] = useState<Extract<PublishReview, { ok: true }>[]>([])
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({})
  const [isPending, setIsPending] = useState(false)
  const [report, setReport] = useState<BulkPublishReportItem[]>([])
  const selectable = filtered.filter((page) => page.pageType === "place" && (page.lifecycleState === "draft" || page.hasUnpublishedChanges))
  const selected = new Set(selectedPlaceIds)

  async function reviewSelected() {
    setIsPending(true)
    const result = await reviewBulkPlacePublishAction(selectedPlaceIds)
    setIsPending(false)
    if (!result.ok) return
    setReviews(result.reviews.filter((review): review is Extract<PublishReview, { ok: true }> => review.ok))
    setAcknowledged({})
    setReport([])
  }

  async function publishSelected() {
    const selection = reviews.map((review) => ({
      pageId: review.pageId,
      expectedDraftUpdatedAt: review.draftUpdatedAt,
      ...(review.warnings.length && acknowledged[review.pageId] ? { override: { warningSetHash: review.warningSetHash, warnings: review.warnings } } : {}),
    }))
    if (!selection.length) return
    setIsPending(true)
    const result = await bulkPublishPlaceDraftsAction(selection)
    setIsPending(false)
    if (result.ok) { setReport(result.report); setReviews([]); setSelectedPlaceIds([]) }
  }

  const warningReviews = reviews.filter((review) => review.warnings.length > 0)
  const readyCount = reviews.filter((review) => review.blockers.length === 0 && (!review.warnings.length || acknowledged[review.pageId])).length

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-xl border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <Input aria-label="Search Destination Pages" placeholder="Search airport name or slug" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter by page type" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All page types</option><option value="airport">Airport Page</option><option value="place">Place Page</option>
        </select>
        <select aria-label="Filter by status" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
        <select aria-label="Filter by attention state" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={attention} onChange={(event) => setAttention(event.target.value)}>
          <option value="all">Attention: all</option><option value="true">Needs attention</option><option value="false">No saved changes</option>
        </select>
      </div>

      {selectable.length > 0 && <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-semibold">Bulk publish Place Drafts</h3><p className="mt-1 text-sm text-muted-foreground">Select only Place Drafts with saved changes. Each page is checked and published separately.</p></div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!selectedPlaceIds.length || isPending} onClick={reviewSelected}>Review selected</Button><Button type="button" disabled={!readyCount || isPending} onClick={publishSelected}>Publish {readyCount || "ready"} Place {readyCount === 1 ? "Draft" : "Drafts"}</Button></div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{selectable.map((page) => <label key={page.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" aria-label={`Select ${page.displayName} for bulk publish`} checked={selected.has(page.id)} disabled={isPending} onChange={() => setSelectedPlaceIds((current) => selected.has(page.id) ? current.filter((id) => id !== page.id) : [...current, page.id])} /><span><span className="block font-medium">{page.displayName}</span><span className="block text-xs text-muted-foreground">{page.slug || "No slug yet"}</span></span></label>)}</div>
        {reviews.length > 0 && <div className="mt-5 space-y-3 border-t border-border pt-4"><h4 className="font-medium">Review results</h4>{reviews.map((review) => <div key={review.pageId} className="rounded-lg border border-border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{review.displayName}</p><p className="text-xs text-muted-foreground">{review.blockers.length ? `${review.blockers.length} blocker${review.blockers.length === 1 ? "" : "s"}` : review.warnings.length ? `${review.warnings.length} warning${review.warnings.length === 1 ? "" : "s"}` : "Ready"}</p></div><Link className="text-primary underline" href={`/admin/destination-pages/${review.pageId}`}>Open page</Link></div>{review.blockers.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive">{review.blockers.map((blocker) => <li key={blocker.code}>{blocker.message}</li>)}</ul>}{review.warnings.length > 0 && <label className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-950"><input type="checkbox" checked={Boolean(acknowledged[review.pageId])} disabled={isPending} onChange={(event) => setAcknowledged((current) => ({ ...current, [review.pageId]: event.target.checked }))} /><span>I reviewed and accept every warning for this page.</span></label>}</div>)}</div>}
        {warningReviews.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Warnings must be acknowledged one page at a time. Blockers cannot be overridden.</p>}
        {report.length > 0 && <div className="mt-5 border-t border-border pt-4"><h4 className="font-medium">Bulk publish report</h4><ul className="mt-2 space-y-2 text-sm">{report.map((item) => <li key={item.pageId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"><span><span className="font-medium">{item.displayName}</span> — <span className={item.status === "published" ? "text-emerald-700" : item.status === "failed" ? "text-destructive" : "text-amber-700"}>{item.status}</span> — {item.reason}</span>{item.fixLink && <Link className="text-primary underline" href={item.fixLink}>Fix</Link>}</li>)}</ul></div>}
      </div>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Display name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Unpublished changes</th><th className="px-4 py-3">Last updated</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((page) => <tr key={page.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium"><Link className="hover:underline" href={`/admin/destination-pages/${page.id}`}>{page.displayName}</Link></td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{page.slug}</td>
              <td className="px-4 py-3">{getDestinationPagePolicy(page.pageType).label}</td>
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
