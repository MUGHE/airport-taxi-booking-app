import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { AirportPageRenderer } from "@/components/airport-page/airport-page-renderer"
import { AirportPageStructuredData } from "@/components/airport-page/airport-page-structured-data"
import { AIRPORT_PAGES, getAirportPage } from "@/lib/airport-content"
import { createAirportPagePresentation, createLegacyAirportHeroImage } from "@/lib/airport-page-data"
import { getDestinationPageLifecycle, getPublishedAirportPage, getPublishedAirportRedirect, type AirportPageSeo } from "@/lib/destination-pages"
import { AIRPORTS, VEHICLE_CLASSES } from "@/lib/fleet"
import { allowLegacyAirportFallback } from "@/lib/legacy-airport-fallback"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return AIRPORT_PAGES.map((airport) => ({ slug: airport.slug }))
}

function pageMetadata(seo: AirportPageSeo): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      images: [{ url: seo.socialImage.url, alt: seo.socialImage.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.socialImage.url],
    },
  }
}

const nonPublicMetadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

function legacyPageSeo(airport: NonNullable<ReturnType<typeof getAirportPage>>): AirportPageSeo {
  const primaryLocation = AIRPORTS.find((location) => airport.locationIds.includes(location.id))
  const heroImage = createLegacyAirportHeroImage(airport)
  return {
    title: airport.title,
    description: airport.description,
    canonical: `/airport-transfers/${airport.slug}`,
    socialImage: { url: heroImage.secureUrl, alt: heroImage.altText },
    airport: {
      officialName: airport.name,
      displayName: airport.shortName,
      iataCode: airport.code,
      serviceArea: airport.area,
      googlePlaceId: "",
      address: `${airport.name}, ${airport.area}, UK`,
      latitude: primaryLocation?.lat ?? 0,
      longitude: primaryLocation?.lng ?? 0,
    },
  }
}

// AIRPORT_PAGES keeps local development usable before migrations are applied.
// Production never publishes this baseline when database content cannot load.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const publishedPage = await getPublishedAirportPage(slug)
  if (publishedPage) return pageMetadata(publishedPage.metadata)

  const lifecycle = await getDestinationPageLifecycle(slug)
  if (lifecycle === "draft" || lifecycle === "archived" || lifecycle === "missing") return nonPublicMetadata
  if (!allowLegacyAirportFallback()) return nonPublicMetadata
  const airport = getAirportPage(slug)
  if (!airport) return nonPublicMetadata
  return pageMetadata(legacyPageSeo(airport))
}

export default async function AirportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const redirectSlug = await getPublishedAirportRedirect(slug)
  if (redirectSlug === "airport-transfers") permanentRedirect("/airport-transfers")
  if (redirectSlug) permanentRedirect(`/airport-transfers/${redirectSlug}`)
  const publishedPage = await getPublishedAirportPage(slug)
  if (publishedPage) return <><AirportPageStructuredData seo={publishedPage.metadata} /><AirportPageRenderer page={publishedPage.presentation} canonicalPath={publishedPage.metadata.canonical} /></>

  const lifecycle = await getDestinationPageLifecycle(slug)
  if (lifecycle === "draft" || lifecycle === "archived" || lifecycle === "missing") notFound()
  if (!allowLegacyAirportFallback()) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">This airport page is temporarily unavailable</h1>
        <p className="mt-4 text-muted-foreground">We could not safely load its published content. Please try again shortly.</p>
      </main>
    )
  }
  const airport = getAirportPage(slug)
  if (!airport) notFound()

  const seo = legacyPageSeo(airport)
  return <><AirportPageStructuredData seo={seo} /><AirportPageRenderer page={createAirportPagePresentation(airport, AIRPORTS, VEHICLE_CLASSES)} canonicalPath={seo.canonical} /></>
}
