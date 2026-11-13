import { SiteHeaderClient } from "@/components/site-header-client"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { listPublishedRoutePages } from "@/lib/route-pages"

export async function SiteHeader() {
  const [airports, routes] = await Promise.all([listPublishedAirportDirectory(), listPublishedRoutePages().catch(() => [])])
  return <SiteHeaderClient airports={airports} routes={routes.map((route) => ({ slug: route.slug, title: route.title }))} />
}
