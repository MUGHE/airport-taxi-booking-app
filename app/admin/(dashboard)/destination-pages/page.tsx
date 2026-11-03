import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAdminDestinationPages } from "@/lib/actions"
import { requireAdminSection } from "@/lib/session"
import { DestinationPagesList } from "@/components/admin/destination-pages-list"

export const metadata: Metadata = { title: "Destination Pages" }
export const dynamic = "force-dynamic"

export default async function AdminDestinationPagesPage() {
  await requireAdminSection("content", "/admin/destination-pages")
  const pages = await getAdminDestinationPages()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Destination Pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find and manage Place Page drafts and published pages. Airport pages have their own tab.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/destination-pages/new?type=place" />}>Create Place Page</Button>
      </div>
      <DestinationPagesList pages={pages} pageType="place" />
    </div>
  )
}
