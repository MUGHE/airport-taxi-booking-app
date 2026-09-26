import { SiteHeaderClient } from "@/components/site-header-client"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"

export async function SiteHeader() {
  return <SiteHeaderClient airports={await listPublishedAirportDirectory()} />
}
