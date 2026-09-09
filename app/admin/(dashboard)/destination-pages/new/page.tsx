import type { Metadata } from "next"
import { DestinationPageEditor } from "@/components/admin/destination-page-editor"

export const metadata: Metadata = { title: "New Airport Page" }

export default function NewDestinationPage() {
  return <DestinationPageEditor />
}
