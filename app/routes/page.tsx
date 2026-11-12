import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { RouteDirectory } from "@/components/route-directory"
import { listPublishedRoutePages } from "@/lib/route-pages"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Taxi Routes",
  description: "Fixed-price private taxi routes between UK airports, towns and cities, in both directions.",
  alternates: { canonical: "/routes" },
}

export default async function RoutesPage() {
  const routes = await listPublishedRoutePages().catch(() => [])
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1"><RouteDirectory routes={routes.map((route) => ({ slug: route.slug, fromName: route.fromName, toName: route.toName }))} /></main>
      <SiteFooter />
    </div>
  )
}
