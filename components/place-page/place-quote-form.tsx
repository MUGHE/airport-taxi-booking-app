"use client"

import { FormEvent, useMemo, useState } from "react"
import { ArrowRight, PlaneTakeoff } from "lucide-react"
import { useRouter } from "next/navigation"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { PlacePagePresentation } from "@/lib/place-page-data"
import { trackPublicEvent } from "@/lib/analytics"

type Direction = "to-airport" | "from-airport"

export function PlaceQuoteForm({ place, sourcePlaceId, sourcePlaceSlug, airports, analyticsEnabled = true }: { place: string; sourcePlaceId?: string; sourcePlaceSlug?: string; airports: PlacePagePresentation["supportedAirports"]; analyticsEnabled?: boolean }) {
  const router = useRouter()
  const usableAirports = useMemo(() => airports.filter((airport) => airport.bookingAvailable && airport.primaryTerminal), [airports])
  const [direction, setDirection] = useState<Direction>("to-airport")
  const [airportId, setAirportId] = useState(usableAirports[0]?.id ?? "")
  const [address, setAddress] = useState<PlaceSelection | null>(null)
  const airport = usableAirports.find((item) => item.id === airportId)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!address || !airport?.primaryTerminal) return

    const terminal = airport.primaryTerminal
    if (analyticsEnabled) trackPublicEvent({ name: "quote_started", sourcePlaceId, sourcePlaceSlug, airportId: airport.id, direction })
    const params = new URLSearchParams({
      direction,
      airportId: airport.id,
      airportAddress: terminal.name,
      airportLat: String(terminal.latitude),
      airportLng: String(terminal.longitude),
      sourcePlaceId: sourcePlaceId || "",
      sourcePlaceSlug: sourcePlaceSlug || "",
    })
    const exact = { address: address.address, lat: String(address.lat), lng: String(address.lng), placeId: address.placeId }
    const exactPrefix = direction === "to-airport" ? "pickup" : "dropoff"
    params.set(`${exactPrefix}Address`, exact.address)
    params.set(`${exactPrefix}Lat`, exact.lat)
    params.set(`${exactPrefix}Lng`, exact.lng)
    params.set(`${exactPrefix}PlaceId`, exact.placeId)
    router.push(`/book?${params.toString()}`)
  }

  if (airports.length === 0 || usableAirports.length === 0) {
    return <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-5 text-white"><p className="font-semibold">Airport booking is currently unavailable</p><p className="mt-1 text-sm text-white/75">Please contact our team and we’ll help arrange your transfer.</p></div>
  }

  return <form onSubmit={submit} className="mt-7 rounded-2xl bg-white p-5 text-foreground shadow-xl" aria-label={`Get a quote from ${place}`}>
    <p className="font-semibold">Start your airport journey</p>
    <p className="mt-1 text-sm text-muted-foreground">Choose an airport, then enter the exact pickup or drop-off address.</p>
    <fieldset className="mt-4">
      <legend className="text-sm font-medium">Journey direction</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {([['to-airport', 'To airport'], ['from-airport', 'From airport']] as const).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="radio" name="direction" value={value} checked={direction === value} onChange={() => { setDirection(value); setAddress(null) }} />{label}</label>)}
      </div>
    </fieldset>
    <div className="mt-4 space-y-1.5"><Label htmlFor="place-airport">Airport</Label><select id="place-airport" value={airportId} onChange={(event) => { const nextAirportId = event.target.value; setAirportId(nextAirportId); setAddress(null); const nextAirport = usableAirports.find((item) => item.id === nextAirportId); if (analyticsEnabled && nextAirport) trackPublicEvent({ name: "supported_airport_selected", sourcePlaceId, sourcePlaceSlug, airportId: nextAirport.id, direction }) }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" aria-label="Choose airport">{airports.map((item) => <option key={item.id} value={item.id} disabled={!item.bookingAvailable || !item.primaryTerminal}>{item.displayName}{!item.bookingAvailable ? " — temporarily unavailable" : !item.primaryTerminal ? " — unavailable" : ""}</option>)}</select>{airport && <p className="text-xs text-muted-foreground"><PlaneTakeoff className="mr-1 inline size-3.5" aria-hidden="true" />Primary terminal: {airport.primaryTerminal?.name}</p>}</div>
    <div className="mt-4 space-y-1.5"><Label htmlFor="place-exact-address">{direction === "to-airport" ? "Exact pickup address or postcode" : "Exact drop-off address or postcode"}</Label><DestinationPicker defaultValue={address?.address} placeholder="Start typing an exact address or postcode" onSelect={setAddress} onClear={() => setAddress(null)} /></div>
    <Button type="submit" size="lg" className="mt-5 w-full" disabled={!address || !airport?.primaryTerminal}>Get a fixed price <ArrowRight className="size-4" /></Button>
    <p className="mt-3 text-center text-xs text-muted-foreground">We use the exact address you select to calculate your route.</p>
  </form>
}
