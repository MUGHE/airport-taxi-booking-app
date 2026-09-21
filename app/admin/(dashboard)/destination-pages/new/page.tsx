import type { Metadata } from "next"
import { DestinationPageEditor } from "@/components/admin/destination-page-editor"
import { getPlaceIdentityOptionsAction, getRelatedDestinationCandidatesAction, getReusableDestinationContentAction } from "@/lib/actions"
import { isDestinationPageType } from "@/lib/destination-page-policy"

export const metadata: Metadata = { title: "New Destination Page" }

export default async function NewDestinationPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const requestedType = (await searchParams).type
  const pageType = isDestinationPageType(requestedType) ? requestedType : "airport"
  return <DestinationPageEditor pageType={pageType} relatedCandidates={await getRelatedDestinationCandidatesAction()} reusableContent={await getReusableDestinationContentAction()} placeIdentityOptions={await getPlaceIdentityOptionsAction()} />
}
