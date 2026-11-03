import type { Metadata } from "next"
import { DestinationPageEditor } from "@/components/admin/destination-page-editor"
import { getPlaceIdentityOptionsAction, getRelatedDestinationCandidatesAction, getReusableDestinationContentAction } from "@/lib/actions"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "New Airport Page" }

export default async function NewAirportPage() {
  await requireAdminSection("content", "/admin/airport-pages/new")
  const [relatedCandidates, reusableContent, placeIdentityOptions] = await Promise.all([
    getRelatedDestinationCandidatesAction(),
    getReusableDestinationContentAction(),
    getPlaceIdentityOptionsAction(),
  ])
  return <DestinationPageEditor pageType="airport" relatedCandidates={relatedCandidates} reusableContent={reusableContent} placeIdentityOptions={placeIdentityOptions} />
}
