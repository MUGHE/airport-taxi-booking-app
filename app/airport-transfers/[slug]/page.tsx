import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { AirportPageRenderer } from "@/components/airport-page/airport-page-renderer"
import { AirportPageStructuredData } from "@/components/airport-page/airport-page-structured-data"
import { getPublishedAirportRedirect, readPublicAirportPage, type AirportPageSeo } from "@/lib/destination-pages"
import { PublicPageServiceError } from "@/components/airport-page/public-page-service-error"
import { getGoogleRating } from "@/lib/google-rating"
import { getStopPricing } from "@/lib/actions"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { AIRPORT_BRIEF_SEO } from "@/lib/airport-brief-seo"

// Cached and rebuilt in the background at most every 5 minutes; publishing in the CMS refreshes it straight away.
export const revalidate = 300

// Published airports are built at deploy time so even the first visit is instant; airports published
// later are built on their first visit. If the database is unreachable at build time this is empty.
export async function generateStaticParams() {
  return (await listPublishedAirportDirectory()).map((airport) => ({ slug: airport.slug }))
}

// CMS titles often already end in the brand; strip it so the layout template adds it once.
function pageTitle(title: string) {
  return title.replace(/(\s*[|–-]\s*one airport taxi)+\s*$/i, "")
}

function pageMetadata(seo: AirportPageSeo): Metadata {
  const title = pageTitle(seo.title)
  return {
    title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      type: "website",
      title: `${title} | ONE Airport Taxi`,
      description: seo.description,
      url: seo.canonical,
      images: [{ url: seo.socialImage.url, alt: seo.socialImage.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ONE Airport Taxi`,
      description: seo.description,
      images: [seo.socialImage.url],
    },
  }
}

const nonPublicMetadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

// Airports with a content brief use its title and description instead of the CMS ones. The title is
// used as written, without the brand suffix the layout would add.
function briefMetadata(seo: AirportPageSeo, brief: { title: string; description: string }): Metadata {
  const metadata = pageMetadata({ ...seo, description: brief.description })
  return {
    ...metadata,
    title: { absolute: brief.title },
    openGraph: { ...metadata.openGraph, title: brief.title },
    twitter: { ...metadata.twitter, title: brief.title },
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const publishedRead = await readPublicAirportPage(slug)
  if (publishedRead.status === "published" || publishedRead.status === "fallback") return AIRPORT_BRIEF_SEO[slug] ? briefMetadata(publishedRead.page.metadata, AIRPORT_BRIEF_SEO[slug]) : pageMetadata(publishedRead.page.metadata)

  return nonPublicMetadata
}

export default async function AirportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const redirectSlug = await getPublishedAirportRedirect(slug)
  if (redirectSlug === "airport-transfers") permanentRedirect("/airport-transfers")
  if (redirectSlug) permanentRedirect(`/airport-transfers/${redirectSlug}`)
  const [publishedRead, googleRating, stopPricing] = await Promise.all([readPublicAirportPage(slug), getGoogleRating(), getStopPricing()])
  if (publishedRead.status === "published" || publishedRead.status === "fallback") return <><AirportPageStructuredData seo={AIRPORT_BRIEF_SEO[slug] ? { ...publishedRead.page.metadata, description: AIRPORT_BRIEF_SEO[slug].description } : publishedRead.page.metadata} /><AirportPageRenderer page={publishedRead.page.presentation} canonicalPath={publishedRead.page.metadata.canonical} googleRating={googleRating} stopPricing={stopPricing} /></>

  if (publishedRead.status === "unavailable") return <PublicPageServiceError retryHref={`/airport-transfers/${slug}`} />

  notFound()
}
