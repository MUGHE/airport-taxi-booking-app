"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Loader2,
  MapPin,
  Plane,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AIRPORTS,
  computeFare,
  formatCurrency,
  getAirport,
  getVehicle,
} from "@/lib/fleet"
import { createBooking, getDistanceQuote } from "@/lib/actions"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import type { TripDirection, VehicleClass } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STEPS = ["Trip", "Vehicle", "Details", "Review"] as const

export function BookingFlow({ vehicles = [] }: { vehicles: VehicleClass[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const hasPrefilledTrip = Boolean(
    params.get("destinationAddress") &&
      params.get("destinationLat") != null &&
      params.get("destinationLng") != null &&
      Number.isFinite(Number(params.get("destinationLat"))) &&
      Number.isFinite(Number(params.get("destinationLng"))) &&
      params.get("pickupDate") &&
      params.get("pickupTime"),
  )

  const [step, setStep] = useState(() => (hasPrefilledTrip ? 1 : 0))
  const [direction, setDirection] = useState<TripDirection>(
    (params.get("direction") as TripDirection) || "from-airport",
  )
  const [airportId, setAirportId] = useState(params.get("airport") || AIRPORTS[0].id)
  const [destination, setDestination] = useState<PlaceSelection | null>(() => {
    const address = params.get("destinationAddress")
    const lat = Number(params.get("destinationLat"))
    const lng = Number(params.get("destinationLng"))
    return address && Number.isFinite(lat) && Number.isFinite(lng)
      ? { placeId: params.get("destinationPlaceId") || "", address, lat, lng }
      : null
  })
  const [vehicleId, setVehicleId] = useState(params.get("vehicle") || "")
  const [pickupDate, setPickupDate] = useState(params.get("pickupDate") || "")
  const [pickupTime, setPickupTime] = useState(params.get("pickupTime") || "")
  const [flightNumber, setFlightNumber] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [bags, setBags] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")

  const vehicle = vehicles.find((v) => v.id === vehicleId)

  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [distanceLoading, setDistanceLoading] = useState(false)


  function handlePlaceSelect(place: PlaceSelection) {
    setDestination(place)
  }

  useEffect(() => {
    let active = true

    if (!destination) {
      setDistanceMiles(null)
      setDurationMinutes(null)
      setDistanceLoading(false)
      return
    }

    setDistanceMiles(null)
    setDistanceLoading(true)
    void getDistanceQuote(airportId, { lat: destination.lat, lng: destination.lng })
      .then((res) => {
        if (!active) return
        if (res.ok && res.distanceMiles != null && res.durationMinutes != null) {
          setDistanceMiles(res.distanceMiles)
          setDurationMinutes(res.durationMinutes)
        } else {
          toast.error(res.error || "Couldn't calculate distance for that address.")
        }
      })
      .catch(() => {
        if (active) toast.error("Couldn't calculate distance for that address.")
      })
      .finally(() => {
        if (active) setDistanceLoading(false)
      })

    return () => {
      active = false
    }
  }, [airportId, destination])

  const quote = useMemo(
    () => (vehicle && distanceMiles != null && durationMinutes != null ? computeFare(vehicle, distanceMiles, durationMinutes) : null),
    [vehicle, distanceMiles, durationMinutes],
  )
  const airport = getAirport(airportId)
  const today = new Date().toISOString().slice(0, 10)

  function canAdvance(): boolean {
    if (step === 0) return Boolean(destination && pickupDate && pickupTime)
    if (step === 1) return Boolean(vehicleId)
    if (step === 2)
      return Boolean(customerName.trim() && email.trim() && phone.trim())
    return true
  }

  function next() {
    if (!canAdvance()) {
      toast.error("Please complete the required fields to continue.")
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function submit() {
    startTransition(async () => {
      const res = await createBooking({
        direction,
        airportId,
        destinationAddress: destination!.address,
        destinationLat: destination!.lat,
        destinationLng: destination!.lng,
        vehicleId,
        pickupDate,
        pickupTime,
        flightNumber: flightNumber.trim(),
        passengers,
        bags,
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      })
      if (res.ok && res.reference) {
        router.push(`/booking/${res.reference}`)
      } else {
        toast.error(res.error || "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <Stepper step={step} />

        <div className="mt-8">
          {step === 0 && (
            <TripStep
              direction={direction}
              setDirection={setDirection}
              airportId={airportId}
              setAirportId={setAirportId}
              destination={destination}
              onDestinationSelect={handlePlaceSelect}
              onDestinationClear={() => {
                setDestination(null)
                setDistanceMiles(null)
                setDurationMinutes(null)
              }}
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
              today={today}
            />
          )}

          {step === 1 && (
            <VehicleStep
              vehicleId={vehicleId}
              setVehicleId={setVehicleId}
              distanceMiles={distanceMiles}
              durationMinutes={durationMinutes}
              vehicles={vehicles}
            />
          )}

          {step === 2 && (
            <DetailsStep
              customerName={customerName}
              setCustomerName={setCustomerName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              passengers={passengers}
              setPassengers={setPassengers}
              bags={bags}
              setBags={setBags}
              notes={notes}
              setNotes={setNotes}
              direction={direction}
              flightNumber={flightNumber}
              setFlightNumber={setFlightNumber}
              maxCapacity={vehicle?.capacity ?? 6}
            />
          )}

          {step === 3 && (
            <ReviewStep
              direction={direction}
              airportName={airport?.name ?? ""}
              destinationAddress={destination?.address ?? ""}
              vehicleName={vehicle?.name ?? ""}
              pickupDate={pickupDate}
              pickupTime={pickupTime}
              flightNumber={flightNumber}
              passengers={passengers}
              bags={bags}
              customerName={customerName}
              email={email}
              phone={phone}
              notes={notes}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0 || isPending}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm booking
            </Button>
          )}
        </div>
      </div>

      <SummaryCard
        direction={direction}
        airportName={airport?.name}
        destinationAddress={destination?.address}
        vehicle={vehicle}
        quote={quote}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
      />
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm font-medium sm:block",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function TripStep(props: {
  direction: TripDirection
  setDirection: (d: TripDirection) => void
  airportId: string
  setAirportId: (v: string) => void
  destination: PlaceSelection | null
  onDestinationSelect: (place: PlaceSelection) => void
  onDestinationClear: () => void
  pickupDate: string
  setPickupDate: (v: string) => void
  pickupTime: string
  setPickupTime: (v: string) => void
  today: string
}) {
  return (
    <div>
      <StepHeading
        title="Where are you headed?"
        desc="Tell us your route and when you'd like to be picked up."
      />

      <div className="mb-5 inline-flex rounded-lg bg-secondary p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => props.setDirection("from-airport")}
          className={cn(
            "rounded-md px-4 py-1.5 transition-colors",
            props.direction === "from-airport"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          From airport
        </button>
        <button
          type="button"
          onClick={() => props.setDirection("to-airport")}
          className={cn(
            "rounded-md px-4 py-1.5 transition-colors",
            props.direction === "to-airport"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          To airport
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Airport" icon={<Plane className="size-4 text-primary" />}>
          <Select value={props.airportId} onValueChange={(value) => value && props.setAirportId(value)}>
            <SelectTrigger className="w-full">
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
        </Field>

        <Field
          label={props.direction === "from-airport" ? "Drop-off location" : "Pickup location"}
          icon={<MapPin className="size-4 text-accent-foreground" />}
        >
          <DestinationPicker
            defaultValue={props.destination?.address}
            onSelect={props.onDestinationSelect}
            onClear={props.onDestinationClear}
            placeholder="Start typing an address"
          />
          {/*
            <SelectTrigger className="w-full">
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
        </Field>

        <Field label="Pickup date">
          <Input
            type="date"
            min={props.today}
            value={props.pickupDate}
            onChange={(e) => props.setPickupDate(e.target.value)}
          />
        </Field>

        <Field label="Pickup time">
          <Input
            type="time"
            value={props.pickupTime}
            onChange={(e) => props.setPickupTime(e.target.value)}
          />
        </Field>

      </div>
    </div>
  )
}

function VehicleStep({
  vehicleId,
  setVehicleId,
  distanceMiles,
  durationMinutes,
  vehicles,
}: {
  vehicleId: string
  setVehicleId: (v: string) => void
  distanceMiles: number | null
  durationMinutes: number | null
  vehicles: VehicleClass[]
}) {
  return (
    <div>
      <StepHeading
        title="Pick your vehicle"
        desc="Fares are fixed and include all taxes, tolls, and gratuity."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {vehicles.map((v) => {
          const q = distanceMiles != null && durationMinutes != null
            ? computeFare(v, distanceMiles, durationMinutes)
            : null
          const selected = v.id === vehicleId
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setVehicleId(v.id)}
              className={cn(
                "flex gap-4 rounded-2xl border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <Image
                  src={v.image || "/placeholder.svg"}
                  alt={v.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{v.name}</h3>
                  {selected && <Check className="size-4 text-primary" />}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {v.capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3.5" /> {v.luggage}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {v.description}
                </p>
                <p className="mt-2 font-semibold tabular-nums">
                  {q ? formatCurrency(q.fare) : `from ${formatCurrency(v.minFare)}`}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DetailsStep(props: {
  customerName: string
  setCustomerName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  passengers: number
  setPassengers: (v: number) => void
  bags: number
  setBags: (v: number) => void
  notes: string
  setNotes: (v: string) => void
  direction: TripDirection
  flightNumber: string
  setFlightNumber: (v: string) => void
  maxCapacity: number
}) {
  return (
    <div>
      <StepHeading
        title="Passenger details"
        desc="We'll send your confirmation and driver details to your email."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            value={props.customerName}
            onChange={(e) => props.setCustomerName(e.target.value)}
            placeholder="Jane Traveler"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={props.email}
            onChange={(e) => props.setEmail(e.target.value)}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            type="tel"
            value={props.phone}
            onChange={(e) => props.setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </Field>
        <Field
          label={
            props.direction === "from-airport"
              ? "Arriving flight number (recommended)"
              : "Departing flight number (optional)"
          }
        >
          <Input
            placeholder="e.g. BA117"
            value={props.flightNumber}
            onChange={(e) => props.setFlightNumber(e.target.value.toUpperCase())}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Passengers">
            <Select
              value={String(props.passengers)}
              onValueChange={(v) => props.setPassengers(Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: props.maxCapacity }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Bags">
            <Select value={String(props.bags)} onValueChange={(v) => props.setBags(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 9 }, (_, i) => i).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes for your driver (optional)">
            <Textarea
              value={props.notes}
              onChange={(e) => props.setNotes(e.target.value)}
              placeholder="Child seat needed, extra luggage, terminal details…"
              rows={3}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function ReviewStep(props: {
  direction: TripDirection
  airportName: string
  destinationAddress: string
  vehicleName: string
  pickupDate: string
  pickupTime: string
  flightNumber: string
  passengers: number
  bags: number
  customerName: string
  email: string
  phone: string
  notes: string
}) {
  const from = props.direction === "from-airport" ? props.airportName : props.destinationAddress
  const to = props.direction === "from-airport" ? props.destinationAddress : props.airportName
  return (
    <div>
      <StepHeading
        title="Review your trip"
        desc="Double-check the details below, then confirm your booking."
      />
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        <Row label="Route" value={`${from} → ${to}`} />
        <Row label="Vehicle" value={props.vehicleName} />
        <Row label="Pickup" value={`${formatDate(props.pickupDate)} at ${props.pickupTime}`} />
        {props.flightNumber && <Row label="Flight" value={props.flightNumber} />}
        <Row label="Party" value={`${props.passengers} passenger(s), ${props.bags} bag(s)`} />
        <Row label="Passenger" value={props.customerName} />
        <Row label="Contact" value={`${props.email} · ${props.phone}`} />
        {props.notes && <Row label="Notes" value={props.notes} />}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  )
}

function SummaryCard(props: {
  direction: TripDirection
  airportName?: string
  destinationAddress?: string
  vehicle?: ReturnType<typeof getVehicle>
  quote: ReturnType<typeof computeFare> | null
  pickupDate: string
  pickupTime: string
}) {
  const from =
    props.direction === "from-airport" ? props.airportName : props.destinationAddress
  const to = props.direction === "from-airport" ? props.destinationAddress : props.airportName
  return (
    <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border/70 bg-card p-5">
      <h3 className="font-semibold">Trip summary</h3>
      <div className="mt-4 space-y-3 text-sm">
        <SummaryLine label="From" value={from || "—"} />
        <SummaryLine label="To" value={to || "—"} />
        <SummaryLine
          label="Pickup"
          value={
            props.pickupDate
              ? `${formatDate(props.pickupDate)}${props.pickupTime ? ` · ${props.pickupTime}` : ""}`
              : "—"
          }
        />
        <SummaryLine label="Vehicle" value={props.vehicle?.name || "—"} />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Total fare</span>
          <span className="text-2xl font-semibold tabular-nums">
            {props.quote ? formatCurrency(props.quote.fare) : "—"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Fixed price · taxes, tolls & gratuity included
        </p>
      </div>
    </aside>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function formatDate(value: string): string {
  if (!value) return ""
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
