import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { PublicPageServiceError } from "@/components/airport-page/public-page-service-error"
import { RoutePageRenderer } from "@/components/route-page/route-page-renderer"
import { RoutePageStructuredData } from "@/components/route-page/route-page-structured-data"
import { listPublishedRoutePages, readPublicRoutePage } from "@/lib/route-pages"

// Route pages are served at the site root, e.g. /heathrow-to-birmingham-taxi: next.config.mjs rewrites
// route-shaped URLs here. Anything that isn't a published route is a 404.

// Cached and rebuilt in the background at most every 5 minutes; saving in the CMS refreshes it straight away.
export const revalidate = 300

export async function generateStaticParams() {
  return (await listPublishedRoutePages()).map((route) => ({ slug: route.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await readPublicRoutePage((await params).slug)
  if (result.status !== "published") return { robots: { index: false, follow: false }, alternates: { canonical: null } }
  const { page } = result
  const canonical = `/${page.slug}`
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical },
    openGraph: { type: "website", title: page.seoTitle, description: page.seoDescription, url: canonical },
    twitter: { card: "summary", title: page.seoTitle, description: page.seoDescription },
  }
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await readPublicRoutePage(slug)
  if (result.status === "redirect") permanentRedirect(`/${result.slug}`)
  if (result.status === "published") return <><RoutePageStructuredData page={result.page} /><RoutePageRenderer page={result.page} /></>
  if (result.status === "unavailable") return <PublicPageServiceError pageType="place" retryHref={`/${slug}`} />
  notFound()
}
