"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowRightLeft, MapPin, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AIRPORTS, LOCATIONS, computeFare, formatCurrency } from "@/lib/fleet"
import type { TripDirection, VehicleClass } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { getDistanceQuote } from "@/lib/actions"
import { toast } from "sonner"


export function FareEstimator({ vehicles = [] }: { vehicles: VehicleClass[] }) {
  const router = useRouter()
  const [direction, setDirection] = useState<TripDirection>("from-airport")
  const [airportId, setAirportId] = useState(AIRPORTS[0].id)
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "executive")

  const [destination, setDestination] = useState<PlaceSelection | null>(null)
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [distanceLoading, setDistanceLoading] = useState(false)

  async function handlePlaceSelect(place: PlaceSelection) {
    setDestination(place)
    setDistanceMiles(null)
    setDistanceLoading(true)
    const res = await getDistanceQuote(airportId, { lat: place.lat, lng: place.lng })
    setDistanceLoading(false)
    if (res.ok && res.distanceMiles != null) {
      setDistanceMiles(res.distanceMiles)
    } else {
      toast.error(res.error || "Couldn't calculate distance for that address.")
    }
  }


  const vehicle = vehicles.find((v) => v.id === vehicleId)

  const quote = useMemo(
    () => (vehicle && distanceMiles != null ? computeFare(vehicle, distanceMiles) : null),
    [vehicle, distanceMiles],
  )

  function handleContinue() {
    const params = new URLSearchParams({
      direction,
      airport: airportId,
      vehicle: vehicleId,
    })
    if (destination) {
      params.set("destinationAddress", destination.address)
      params.set("destinationLat", String(destination.lat))
      params.set("destinationLng", String(destination.lng))
      params.set("destinationPlaceId", destination.placeId)
    }
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
          {AIRPORTS.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
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
        onSelect={handlePlaceSelect}
        onClear={() => {
          setDestination(null)
          setDistanceMiles(null)
        }}
        placeholder={direction === "from-airport" ? "Enter drop-off address" : "Enter pickup address"}
      />
      {/*
        <SelectTrigger className="w-full">
          <MapPin className="size-4 text-accent-foreground" />
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {LOCATIONS.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name} · {l.area}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}
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
        <div className="grid gap-4 @min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @min-[480px]">
          {direction === "from-airport" ? airportField : locationField}
          <div className="hidden  pt-2.5 items-center text-muted-foreground @min-[480px]:flex">
            <ArrowRightLeft className="size-4" />
          </div>
          {direction === "from-airport" ? locationField : airportField}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Vehicle</Label>
          <Select value={vehicleId} onValueChange={(value) => value && setVehicleId(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} · up to {v.capacity} pax
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-secondary/70 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Estimated fixed fare</p>
          <p className="text-2xl font-semibold tabular-nums">
            {quote ? formatCurrency(quote.fare) : "—"}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {quote ? (
            <>
              <p>{quote.distanceMiles} miles</p>
              <p>All taxes included</p>
            </>
          ) : (
            <p>Select a location</p>
          )}
        </div>
      </div>

      <Button
        className="mt-4 w-full"
        size="lg"
        disabled={!destination || distanceLoading}
        onClick={handleContinue}
      >
        Continue to booking
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
