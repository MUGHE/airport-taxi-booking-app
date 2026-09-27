import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAdminDestinationPageById, getPlaceIdentityOptionsAction, getRelatedDestinationCandidatesAction, getReusableDestinationContentAction } from "@/lib/actions"
import { DestinationPageEditor } from "@/components/admin/destination-page-editor"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "Edit Destination Page" }
export const dynamic = "force-dynamic"

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdminSection("content", `/admin/destination-pages/${id}`)
  const page = await getAdminDestinationPageById(id)
  if (!page) notFound()
  const [relatedCandidates, reusableContent, placeIdentityOptions] = await Promise.all([
    getRelatedDestinationCandidatesAction(page.id),
    getReusableDestinationContentAction(),
    getPlaceIdentityOptionsAction(),
  ])
  return <DestinationPageEditor pageType={page.pageType} initialPage={page} relatedCandidates={relatedCandidates} reusableContent={reusableContent} placeIdentityOptions={placeIdentityOptions} />
}
