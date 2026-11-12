import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { RoutePageEditor } from "@/components/admin/route-page-editor"
import { getAdminRoutePage, listRouteEndpoints } from "@/lib/route-pages"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "Edit route page" }
export const dynamic = "force-dynamic"

export default async function EditRoutePagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdminSection("content", `/admin/route-pages/${id}`)
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [route, endpoints] = await Promise.all([getAdminRoutePage(id), listRouteEndpoints()])
  if (!route) notFound()
  return (
    <div>
      <Link href="/admin/route-pages" className="text-sm text-muted-foreground hover:text-foreground">← All route pages</Link>
      <h2 className="mb-6 mt-2 text-xl font-semibold tracking-tight">Edit route page</h2>
      <RoutePageEditor key={route.id} route={route} endpoints={endpoints} />
    </div>
  )
}
