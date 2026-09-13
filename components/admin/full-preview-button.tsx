"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FullPreviewButton({ pageId, dirty }: { pageId?: string; dirty: boolean }) {
  const previewUrl = pageId ? `/admin/destination-pages/${pageId}/preview` : ""

  if (!pageId) return <Button type="button" variant="outline" disabled title="Save this Draft once to enable Full Preview"><ExternalLink className="size-4" /> Full preview</Button>

  return <Button variant="outline" nativeButton={false} render={<Link href={previewUrl} target="_blank" rel="noreferrer" title={dirty ? "Full Preview shows the last saved Draft" : "Open Full Preview"} />}><ExternalLink className="size-4" /> Full preview</Button>
}
