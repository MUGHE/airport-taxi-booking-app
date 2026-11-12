import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listAdminRoutePages, listRouteEndpoints } from "@/lib/route-pages"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "Route Pages" }
export const dynamic = "force-dynamic"

export default async function AdminRoutePagesPage() {
  await requireAdminSection("content", "/admin/route-pages")
  const [routes, endpoints] = await Promise.all([listAdminRoutePages(), listRouteEndpoints()])
  const names = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint.name]))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Route Pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">One page per route, covering both directions, e.g. Heathrow to Birmingham and Birmingham to Heathrow.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/route-pages/new" />}><Plus className="size-4" />New route page</Button>
      </div>

      {routes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No route pages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose two airports or towns to create the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Route</TableHead><TableHead>Status</TableHead><TableHead>Distance</TableHead><TableHead>Updated</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => {
                const a = names.get(route.endpointAId)
                const b = names.get(route.endpointBId)
                return (
                  <TableRow key={route.id}>
                    <TableCell className="max-w-md">
                      <Link href={`/admin/route-pages/${route.id}`} className="font-medium hover:underline">{a && b ? `${a} ⇄ ${b}` : route.slug}</Link>
                      <p className="truncate text-xs text-muted-foreground">/{route.slug}</p>
                      {(!a || !b) && <p className="text-xs text-destructive">A place on this route is no longer published, so the page is hidden.</p>}
                    </TableCell>
                    <TableCell><Badge variant={route.status === "published" ? "default" : "secondary"}>{route.status === "published" ? "Published" : "Draft"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{route.distanceMiles != null ? `${Math.round(route.distanceMiles)} mi` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(route.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
