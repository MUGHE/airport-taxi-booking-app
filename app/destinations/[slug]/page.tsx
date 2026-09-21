import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { PlacePageRenderer } from "@/components/place-page/place-page-renderer"
import { PlacePageStructuredData } from "@/components/place-page/place-page-structured-data"
import { PublicPageServiceError } from "@/components/airport-page/public-page-service-error"
import { getPublishedPlaceRedirect, readPublicPlacePage } from "@/lib/destination-pages"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await readPublicPlacePage((await params).slug)
  if (result.status === "published" || result.status === "fallback") return {
    title: result.page.metadata.title,
    description: result.page.metadata.description,
    alternates: { canonical: result.page.metadata.canonical },
    openGraph: {
      type: "website",
      title: result.page.metadata.title,
      description: result.page.metadata.description,
      url: result.page.metadata.canonical,
      images: [{ url: result.page.metadata.socialImage.url, alt: result.page.metadata.socialImage.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: result.page.metadata.title,
      description: result.page.metadata.description,
      images: [result.page.metadata.socialImage.url],
    },
  }
  return { robots: { index: false, follow: false }, alternates: { canonical: null } }
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const redirectSlug = await getPublishedPlaceRedirect(slug)
  if (redirectSlug === "destinations") permanentRedirect("/destinations")
  if (redirectSlug) permanentRedirect(`/destinations/${redirectSlug}`)
  const result = await readPublicPlacePage(slug)
  if (result.status === "published" || result.status === "fallback") return <><PlacePageStructuredData page={result.page} /><PlacePageRenderer page={result.page.presentation} canonicalPath={result.page.metadata.canonical} /></>
  if (result.status === "unavailable") return <PublicPageServiceError pageType="place" retryHref={`/destinations/${slug}`} />
  notFound()
}
