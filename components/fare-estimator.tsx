"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowRightLeft, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AIRPORTS } from "@/lib/fleet"
import type { TripDirection } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"

export function FareEstimator() {
  const router = useRouter()
  const [direction, setDirection] = useState<TripDirection>("from-airport")
  const [airportId, setAirportId] = useState(AIRPORTS[0].id)
  const [destination, setDestination] = useState<PlaceSelection | null>(null)
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const today = new Date().toISOString().slice(0, 10)

  function handleContinue() {
    if (!destination || !pickupDate || !pickupTime) return

    const params = new URLSearchParams({
      direction,
      airport: airportId,
      pickupDate,
      pickupTime,
      destinationAddress: destination.address,
      destinationLat: String(destination.lat),
      destinationLng: String(destination.lng),
      destinationPlaceId: destination.placeId,
    })
    router.push(`/book?${params.toString()}`)
  }

  const airportField = (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Airport</Label>
      <Select value={airportId} onValueChange={(value) => value && setAirportId(value)}>
        <SelectTrigger className="w-full">
          <Plane className="size-4 text-primary" />
          <SelectValue placeholder="Select airport" />
        </SelectTrigger>
        <SelectContent>
          {AIRPORTS.map((airport) => (
            <SelectItem key={airport.id} value={airport.id}>
              {airport.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const locationField = (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {direction === "from-airport" ? "Drop-off" : "Pickup"}
      </Label>
      <DestinationPicker
        onSelect={setDestination}
        onClear={() => setDestination(null)}
        placeholder={direction === "from-airport" ? "Enter drop-off address" : "Enter pickup address"}
      />
    </div>
  )

  return (
    <div className="@container w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
      <div className="mb-4 inline-flex rounded-lg bg-secondary p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setDirection("from-airport")}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            direction === "from-airport"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          From airport
        </button>
        <button
          type="button"
          onClick={() => setDirection("to-airport")}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            direction === "to-airport"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          To airport
        </button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 @min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @min-[480px]:items-end">
          {direction === "from-airport" ? airportField : locationField}
          <div className="hidden items-center pb-2.5 text-muted-foreground @min-[480px]:flex">
            <ArrowRightLeft className="size-4" />
          </div>
          {direction === "from-airport" ? locationField : airportField}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Pickup date</Label>
            <Input
              type="date"
              min={today}
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Pickup time</Label>
            <Input
              type="time"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
            />
          </div>
        </div>
      </div>

      <Button
        className="mt-5 w-full"
        size="lg"
        disabled={!destination || !pickupDate || !pickupTime}
        onClick={handleContinue}
      >
        Choose your vehicle
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
