import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAdminDestinationPages } from "@/lib/actions"
import { DestinationPagesList } from "@/components/admin/destination-pages-list"

export const metadata: Metadata = { title: "Destination Pages" }
export const dynamic = "force-dynamic"

export default async function AdminDestinationPagesPage() {
  const pages = await getAdminDestinationPages()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Destination Pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find and manage Airport Page drafts and published pages.</p>
        </div>
        <Button render={<Link href="/admin/destination-pages/new" />}>Create Destination Page</Button>
      </div>
      <DestinationPagesList pages={pages} />
    </div>
  )
}
