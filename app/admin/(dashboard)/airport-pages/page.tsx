import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAdminDestinationPages } from "@/lib/actions"
import { requireAdminSection } from "@/lib/session"
import { DestinationPagesList } from "@/components/admin/destination-pages-list"

export const metadata: Metadata = { title: "Airport Pages" }
export const dynamic = "force-dynamic"

export default async function AdminAirportPagesPage() {
  await requireAdminSection("content", "/admin/airport-pages")
  const pages = await getAdminDestinationPages()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Airport Pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create airport transfer pages and manage their drafts and published versions.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/airport-pages/new" />}>Create Airport Page</Button>
      </div>
      <DestinationPagesList pages={pages} pageType="airport" />
    </div>
  )
}
