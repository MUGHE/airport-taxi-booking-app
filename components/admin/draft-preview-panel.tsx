"use client"

import Link from "next/link"
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const viewports = [
  { id: "desktop", label: "Desktop", width: 1440, icon: Monitor },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
] as const

export function DraftPreviewPanel({ pageId, dirty }: { pageId?: string; dirty: boolean }) {
  const [viewport, setViewport] = useState<(typeof viewports)[number]["id"]>("desktop")
  const selected = viewports.find((item) => item.id === viewport) ?? viewports[0]
  const previewUrl = pageId ? `/admin/destination-pages/${pageId}/preview` : ""

  return <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-label="Draft preview">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-semibold">Side-by-side Draft preview</h3><p className="mt-1 text-sm text-muted-foreground">This uses the same Airport Page renderer as the public page.</p></div>
      {pageId && <Button variant="outline" size="sm" nativeButton={false} render={<Link href={previewUrl} target="_blank" rel="noreferrer" />}><ExternalLink className="size-4" /> Open full preview</Button>}
    </div>
    {dirty && pageId && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">Changes have not been saved. Preview shows the last saved Draft.</p>}
    {!pageId && <p className="rounded-lg bg-secondary px-3 py-2 text-sm">Save this Draft once to enable its secure preview.</p>}
    {pageId && <>
      <div className="flex flex-wrap gap-2" aria-label="Preview viewport">
        {viewports.map(({ id, label, icon: Icon }) => <Button key={id} type="button" size="sm" variant={viewport === id ? "default" : "outline"} aria-pressed={viewport === id} onClick={() => setViewport(id)}><Icon className="size-4" /> {label}</Button>)}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-3"><iframe title={`${selected.label} Draft preview`} src={previewUrl} className="mx-auto block min-h-[720px] bg-background shadow-sm" style={{ width: selected.width, maxWidth: "none" }} /></div>
      <p className="text-xs text-muted-foreground">Preview viewport: {selected.width}px wide. Draft previews are private and excluded from search discovery.</p>
    </>}
  </section>
}
