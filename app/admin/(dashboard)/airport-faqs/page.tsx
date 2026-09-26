import type { Metadata } from "next"
import { AirportFaqsManager } from "@/components/admin/airport-faqs-manager"
import { getAdminAirportFaqsAction } from "@/lib/actions"

export const metadata: Metadata = { title: "Airport FAQs" }
export const dynamic = "force-dynamic"

export default async function AirportFaqsPage() {
  return <div><div className="mb-6"><h2 className="text-xl font-semibold tracking-tight">Airport FAQs</h2><p className="mt-1 text-sm text-muted-foreground">Manage the single approved FAQ set used across every airport page.</p></div><AirportFaqsManager initialFaqs={await getAdminAirportFaqsAction()} /></div>
}
