"use client"

import { useEffect, useState } from "react"
import { ArrowRight, ArrowRightLeft, Calendar as CalendarIcon, MapPinPlus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/fleet"
import { formatDate, formatTimeLabel, localDate, minPickupTimeToday, TIME_SLOTS } from "@/lib/datetime"
import type { StopPricing } from "@/lib/types"
import { toast } from "sonner"

const NO_STOP_PRICING: StopPricing = { pricePerStop: 0, updatedAt: "" }
// Mirrors the server-side cap in lib/actions.ts and the booking flow's Trip step — keep in sync.
const MAX_STOPS = 3

export function FareEstimator({ stopPricing = NO_STOP_PRICING }: { stopPricing?: StopPricing }) {
  const router = useRouter()
  const [pickup, setPickup] = useState<PlaceSelection | null>(null)
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(null)
  const [stops, setStops] = useState<PlaceSelection[]>([])
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [dateOpen, setDateOpen] = useState(false)
  const today = localDate(new Date())
  const isToday = pickupDate === today
  // For a same-day pickup, the earliest selectable slot is "now" rounded up to the
  // 15-minute grid — not an arbitrary slot further out.
  const minTimeToday = minPickupTimeToday()
  const availableTimes = isToday ? TIME_SLOTS.filter((t) => t >= minTimeToday) : TIME_SLOTS

  // Defends against the date having rolled over to a new day while the tab was open.
  useEffect(() => {
    if (pickupDate && pickupDate < today) setPickupDate(today)
  }, [pickupDate, today])

  // If a time was picked before the date (so it wasn't yet checked against the lead-time
  // floor), re-validate it once the date lands on today — otherwise a too-soon time can stay
  // selected. Mirrors the same effect in the booking flow's Trip step.
  useEffect(() => {
    if (pickupDate === today && pickupTime) {
      const minTime = minPickupTimeToday()
      if (pickupTime < minTime) setPickupTime(minTime)
    }
  }, [pickupDate, today])

  function handleDateChange(value: string) {
    if (value && value < today) { toast.error("Pickup date can't be in the past."); setPickupDate(today); return }
    setPickupDate(value)
  }
  function handleTimeChange(value: string) {
    if (isToday && value && value < minTimeToday) { toast.error("Pickup time can't be in the past."); setPickupTime(minTimeToday); return }
    setPickupTime(value)
  }

  function addStop() { if (stops.length < MAX_STOPS) setStops([...stops, { placeId: "", address: "", lat: NaN, lng: NaN }]) }
  function updateStop(index: number, value: PlaceSelection) { setStops(stops.map((s, i) => (i === index ? value : s))) }
  function removeStop(index: number) { setStops(stops.filter((_, i) => i !== index)) }

  function continueToBooking() {
    if (!pickup || !dropoff || !pickupDate || !pickupTime) return
    const validStops = stops.filter((s) => s.address && Number.isFinite(s.lat) && Number.isFinite(s.lng))
    const params = new URLSearchParams({
      pickupAddress: pickup.address, pickupLat: String(pickup.lat), pickupLng: String(pickup.lng), pickupPlaceId: pickup.placeId,
      dropoffAddress: dropoff.address, dropoffLat: String(dropoff.lat), dropoffLng: String(dropoff.lng), dropoffPlaceId: dropoff.placeId,
      pickupDate, pickupTime,
      ...(validStops.length > 0 ? { stops: JSON.stringify(validStops) } : {}),
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Pickup date</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger render={<Button variant="outline" className="w-full justify-start gap-2 font-normal" />}>
              <CalendarIcon className="size-4 text-muted-foreground" />
              {pickupDate ? formatDate(pickupDate) : "Select date"}
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                required
                selected={pickupDate ? new Date(`${pickupDate}T00:00:00`) : undefined}
                onSelect={(date) => { if (!date) return; handleDateChange(localDate(date)); setDateOpen(false) }}
                disabled={{ before: new Date(`${today}T00:00:00`) }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Pickup time</Label>
          <Select value={pickupTime} onValueChange={(value) => { if (value) handleTimeChange(value) }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select time" /></SelectTrigger>
            <SelectContent>{availableTimes.map((t) => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs font-medium text-muted-foreground">Stops along the way (optional)</Label>
          {stopPricing.pricePerStop > 0 && <span className="text-xs text-muted-foreground">+{formatCurrency(stopPricing.pricePerStop)} per stop</span>}
        </div>
        {stops.length > 0 && <div className="mt-2 space-y-2">
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1"><DestinationPicker defaultValue={stop.address} placeholder={`Stop ${index + 1} address`} onSelect={(place) => updateStop(index, place)} onClear={() => updateStop(index, { placeId: "", address: "", lat: NaN, lng: NaN })} /></div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeStop(index)} aria-label={`Remove stop ${index + 1}`}><X className="size-4" /></Button>
            </div>
          ))}
        </div>}
        {stops.length < MAX_STOPS && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addStop}><MapPinPlus className="size-4" />Add a stop</Button>}
      </div>
      <Button className="mt-5 w-full" size="lg" disabled={!pickup || !dropoff || !pickupDate || !pickupTime} onClick={continueToBooking}>Choose your vehicle <ArrowRight className="size-4" /></Button>
    </div>
  )
}

function LocationField({ label, placeholder, value, onSelect, onClear }: { label: string; placeholder: string; value?: string; onSelect: (place: PlaceSelection) => void; onClear: () => void }) {
  return <div className="min-w-0 space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label><DestinationPicker defaultValue={value} placeholder={placeholder} onSelect={onSelect} onClear={onClear} /></div>
}
