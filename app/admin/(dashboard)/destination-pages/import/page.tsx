import type { Metadata } from "next"
import { PlaceCsvImporter } from "@/components/admin/place-csv-importer"

export const metadata: Metadata = { title: "Import Place Drafts" }

export default function ImportPlaceDraftsPage() {
  return <PlaceCsvImporter />
}
