import { SiteHeaderClient } from "@/components/site-header-client"
import { listFeaturedAirports } from "@/lib/airport-directory"

export async function SiteHeader() {
  return <SiteHeaderClient featuredAirports={await listFeaturedAirports()} />
}
