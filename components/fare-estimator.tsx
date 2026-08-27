"use client"

import { useState } from "react"
import { ArrowRight, ArrowRightLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FareEstimator() {
  const router = useRouter()
  const [pickup, setPickup] = useState<PlaceSelection | null>(null)
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(null)
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const today = new Date().toISOString().slice(0, 10)

  function continueToBooking() {
    if (!pickup || !dropoff || !pickupDate || !pickupTime) return
    const params = new URLSearchParams({
      pickupAddress: pickup.address, pickupLat: String(pickup.lat), pickupLng: String(pickup.lng), pickupPlaceId: pickup.placeId,
      dropoffAddress: dropoff.address, dropoffLat: String(dropoff.lat), dropoffLng: String(dropoff.lng), dropoffPlaceId: dropoff.placeId,
      pickupDate, pickupTime,
    })
    router.push(`/book?${params.toString()}`)
  }

  return (
    <div className="@container w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
      <div className="grid gap-4 @min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @min-[480px]:items-end">
        <LocationField label="Pickup" placeholder="Enter pickup address" value={pickup?.address} onSelect={setPickup} onClear={() => setPickup(null)} />
        <div className="hidden pb-2.5 items-center text-muted-foreground @min-[480px]:flex"><ArrowRightLeft className="size-4" /></div>
        <LocationField label="Drop-off" placeholder="Enter drop-off address" value={dropoff?.address} onSelect={setDropoff} onClear={() => setDropoff(null)} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Pickup date</Label><Input type="date" min={today} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Pickup time</Label><Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} /></div>
      </div>
      <Button className="mt-5 w-full" size="lg" disabled={!pickup || !dropoff || !pickupDate || !pickupTime} onClick={continueToBooking}>Choose your vehicle <ArrowRight className="size-4" /></Button>
    </div>
  )
}

function LocationField({ label, placeholder, value, onSelect, onClear }: { label: string; placeholder: string; value?: string; onSelect: (place: PlaceSelection) => void; onClear: () => void }) {
  return <div className="min-w-0 space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label><DestinationPicker defaultValue={value} placeholder={placeholder} onSelect={onSelect} onClear={onClear} /></div>
}
