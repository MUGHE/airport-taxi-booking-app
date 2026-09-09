import type { Metadata } from "next"
import { DestinationPageEditor } from "@/components/admin/destination-page-editor"
import { getRelatedDestinationCandidatesAction, getReusableDestinationContentAction } from "@/lib/actions"

export const metadata: Metadata = { title: "New Airport Page" }

export default async function NewDestinationPage() {
  return <DestinationPageEditor relatedCandidates={await getRelatedDestinationCandidatesAction()} reusableContent={await getReusableDestinationContentAction()} />
}
