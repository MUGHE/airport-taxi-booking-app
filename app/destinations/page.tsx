import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PlaceDirectory } from "@/components/place-directory"
import { PublicPageServiceError } from "@/components/airport-page/public-page-service-error"
import { readPlaceDirectory } from "@/lib/place-directory"

export const metadata: Metadata = { title: "Destinations", description: "Find the towns, boroughs, cities, and neighbourhoods served by ONE Airport Taxi.", alternates: { canonical: "/destinations" } }

export default async function DestinationsPage() {
  const result = await readPlaceDirectory()
  return <div className="flex min-h-screen flex-col"><SiteHeader /><main className="flex-1">{result.status === "unavailable" ? <PublicPageServiceError pageType="place" retryHref="/destinations" /> : <PlaceDirectory directory={result.directory} />}</main><SiteFooter /></div>
}
