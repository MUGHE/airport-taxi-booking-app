import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAdminDestinationPageById, getRelatedDestinationCandidatesAction, getReusableDestinationContentAction } from "@/lib/actions"
import { DestinationPageEditor } from "@/components/admin/destination-page-editor"

export const metadata: Metadata = { title: "Edit Airport Page" }
export const dynamic = "force-dynamic"

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await getAdminDestinationPageById(id)
  if (!page) notFound()
  return <DestinationPageEditor initialPage={page} relatedCandidates={await getRelatedDestinationCandidatesAction(page.id)} reusableContent={await getReusableDestinationContentAction()} />
}
