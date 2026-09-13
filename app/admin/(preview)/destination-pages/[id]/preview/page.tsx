import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { AirportPageRenderer } from "@/components/airport-page/airport-page-renderer"
import { isAdminAuthenticated } from "@/lib/session"
import { createDraftAirportPagePresentation } from "@/lib/destination-pages"
import { getAdminDestinationPage } from "@/lib/admin-destination-pages"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Full Preview",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
}

export default async function DraftPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await isAdminAuthenticated())) redirect(`/admin/login?from=/admin/destination-pages/${id}/preview`)
  const page = await getAdminDestinationPage(id)
  if (!page) notFound()
  return <AirportPageRenderer page={await createDraftAirportPagePresentation(page)} />
}
