import type { Metadata } from "next"
import Link from "next/link"
import { RoutePageEditor } from "@/components/admin/route-page-editor"
import { listRouteEndpoints } from "@/lib/route-pages"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "New route page" }
export const dynamic = "force-dynamic"

export default async function NewRoutePagePage() {
  await requireAdminSection("content", "/admin/route-pages/new")
  return (
    <div>
      <Link href="/admin/route-pages" className="text-sm text-muted-foreground hover:text-foreground">← All route pages</Link>
      <h2 className="mb-6 mt-2 text-xl font-semibold tracking-tight">New route page</h2>
      <RoutePageEditor endpoints={await listRouteEndpoints()} />
    </div>
  )
}
