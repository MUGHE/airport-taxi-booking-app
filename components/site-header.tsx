import { SiteHeaderClient } from "@/components/site-header-client"
import { SiteOfferBar } from "@/components/site-offer-bar"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { getSitePromotion } from "@/lib/actions"
import { listPublishedRoutePages } from "@/lib/route-pages"

export async function SiteHeader() {
  const [airports, routes, promotion] = await Promise.all([
    listPublishedAirportDirectory(),
    listPublishedRoutePages().catch(() => []),
    // A failed read only hides the offer strip; it never takes the page down.
    getSitePromotion().catch(() => null),
  ])
  return (
    <>
      <SiteHeaderClient airports={airports} routes={routes.map((route) => ({ slug: route.slug, title: route.title }))} />
      {promotion?.active && promotion.discountPercent > 0 && <SiteOfferBar percent={promotion.discountPercent} />}
    </>
  )
}
