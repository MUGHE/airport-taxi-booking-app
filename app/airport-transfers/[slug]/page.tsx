import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AirportPageRenderer } from "@/components/airport-page/airport-page-renderer"
import { AIRPORT_PAGES, getAirportPage } from "@/lib/airport-content"
import { createAirportPagePresentation } from "@/lib/airport-page-data"
import { AIRPORTS, VEHICLE_CLASSES } from "@/lib/fleet"

export function generateStaticParams() {
  return AIRPORT_PAGES.map((airport) => ({ slug: airport.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const airport = getAirportPage(slug)
  if (!airport) return {}

  return {
    title: airport.title,
    description: airport.description,
    alternates: { canonical: `/airport-transfers/${airport.slug}` },
  }
}

export default async function AirportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const airport = getAirportPage(slug)
  if (!airport) notFound()

  return <AirportPageRenderer page={createAirportPagePresentation(airport, AIRPORTS, VEHICLE_CLASSES)} />
}
