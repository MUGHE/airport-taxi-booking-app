"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Calendar as CalendarIcon, Loader2, MapPinPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { PaymentMethodPicker } from "@/components/booking/booking-flow"
import { updateBookingAction } from "@/lib/actions"
import { formatCurrency } from "@/lib/fleet"
import { formatDate, formatTimeLabel, localDate, TIME_SLOTS } from "@/lib/datetime"
import type { Booking, BookingAddOn, PaymentMethod, VehicleClass } from "@/lib/types"
import { toast } from "sonner"

// Mirrors the server-side cap in lib/actions.ts and the booking flow's Trip step — keep in sync.
const MAX_STOPS = 3

const emptyStop = (): PlaceSelection => ({ placeId: "", address: "", lat: NaN, lng: NaN })

export function EditBookingDialog({
  booking,
  vehicles,
  addOns,
  onClose,
}: {
  booking: Booking
  vehicles: VehicleClass[]
  addOns: Array<BookingAddOn & { active: boolean }>
  onClose: () => void
}) {
  const router = useRouter()
  const [pickup, setPickup] = useState<PlaceSelection | null>(
    booking.pickupAddress && Number.isFinite(booking.pickupLat) && Number.isFinite(booking.pickupLng)
      ? { placeId: "", address: booking.pickupAddress, lat: booking.pickupLat!, lng: booking.pickupLng! }
      : null,
  )
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(
    booking.dropoffAddress && Number.isFinite(booking.dropoffLat) && Number.isFinite(booking.dropoffLng)
      ? { placeId: "", address: booking.dropoffAddress, lat: booking.dropoffLat!, lng: booking.dropoffLng! }
      : null,
  )
  const [stops, setStops] = useState<PlaceSelection[]>(booking.stops.map((s) => ({ ...s })))
  const [vehicleId, setVehicleId] = useState(booking.vehicleId)
  const [pickupDate, setPickupDate] = useState(booking.pickupDate)
  const [pickupTime, setPickupTime] = useState(booking.pickupTime)
  const [dateOpen, setDateOpen] = useState(false)
  const [flightNumber, setFlightNumber] = useState(booking.flightNumber)
  const [passengers, setPassengers] = useState(booking.passengers)
  const [bags, setBags] = useState(booking.bags)
  const [customerName, setCustomerName] = useState(booking.customerName)
  const [email, setEmail] = useState(booking.email)
  const [phone, setPhone] = useState(booking.phone)
  const [notes, setNotes] = useState(booking.notes)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(booking.paymentMethod)
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(booking.addOns.map((a) => a.id))
  const [isPending, startTransition] = useTransition()

  const vehicle = vehicles.find((v) => v.id === vehicleId)
  const maxCapacity = vehicle?.capacity ?? 6
  const maxLuggage = vehicle?.luggage ?? 0

  function addStop() { if (stops.length < MAX_STOPS) setStops([...stops, emptyStop()]) }
  function updateStop(index: number, value: PlaceSelection) { setStops(stops.map((s, i) => (i === index ? value : s))) }
  function removeStop(index: number) { setStops(stops.filter((_, i) => i !== index)) }

  function save() {
    if (!pickup || !dropoff) return toast.error("Select both a pickup and drop-off location.")
    if (!customerName.trim() || !email.trim() || !phone.trim()) return toast.error("Name, email, and phone are required.")
    if (!pickupDate || !pickupTime) return toast.error("Choose a pickup date and time.")
    startTransition(async () => {
      const res = await updateBookingAction(booking.reference, {
        pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffAddress: dropoff.address, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
        stops: stops.filter((s) => s.address && Number.isFinite(s.lat) && Number.isFinite(s.lng)),
        vehicleId, pickupDate, pickupTime, flightNumber, passengers, bags,
        customerName, email, phone, notes, addOnIds: selectedAddOnIds, paymentMethod,
      })
      if (!res.ok || !res.booking) { toast.error(res.error || "Could not save these changes."); return }
      toast.success(`${res.booking.reference} updated — new fare ${formatCurrency(res.booking.fare)}.`)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Edit booking">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Edit booking</h2>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{booking.reference}</p>
          </div>
          <Button variant="secondary" size="icon-sm" onClick={onClose} aria-label="Close"><X /></Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Pickup location"><DestinationPicker defaultValue={pickup?.address} placeholder="Pickup address" onSelect={setPickup} onClear={() => setPickup(null)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Drop-off location"><DestinationPicker defaultValue={dropoff?.address} placeholder="Drop-off address" onSelect={setDropoff} onClear={() => setDropoff(null)} /></Field></div>

          <Field label="Pickup date">
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
                  onSelect={(date) => { if (!date) return; setPickupDate(localDate(date)); setDateOpen(false) }}
                />
              </PopoverContent>
            </Popover>
          </Field>
          <Field label="Pickup time">
            <Select value={pickupTime} onValueChange={(value) => value && setPickupTime(value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select time" /></SelectTrigger>
              <SelectContent>{TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Vehicle">
            <Select value={vehicleId} onValueChange={(value) => value && setVehicleId(value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Flight number"><Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} /></Field>

          <Field label="Passengers">
            <Select value={String(Math.min(passengers, maxCapacity))} onValueChange={(value) => value && setPassengers(Number(value))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: maxCapacity }, (_, i) => i + 1).map((v) => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Bags">
            <Select value={String(Math.min(bags, maxLuggage))} onValueChange={(value) => value && setBags(Number(value))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: maxLuggage + 1 }, (_, i) => i).map((v) => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Full name"><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Phone"><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Stops</p>
          </div>
          {stops.length > 0 && <div className="mt-2 space-y-2">
            {stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1"><DestinationPicker defaultValue={stop.address} placeholder={`Stop ${index + 1} address`} onSelect={(place) => updateStop(index, place)} onClear={() => updateStop(index, emptyStop())} /></div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeStop(index)} aria-label={`Remove stop ${index + 1}`}><X className="size-4" /></Button>
              </div>
            ))}
          </div>}
          {stops.length < MAX_STOPS && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addStop}><MapPinPlus className="size-4" />Add a stop</Button>}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Add-ons</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {addOns.map((addOn) => {
              const checked = selectedAddOnIds.includes(addOn.id)
              return (
                <label key={addOn.id} className="flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={() => setSelectedAddOnIds(checked ? selectedAddOnIds.filter((id) => id !== addOn.id) : [...selectedAddOnIds, addOn.id])} />
                    <span className={addOn.active ? "" : "text-muted-foreground"}>{addOn.name}{!addOn.active && " (disabled)"}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(addOn.price)}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="mt-4"><Field label="Notes for driver"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></Field></div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Payment method</p>
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">Saving recalculates the fare from the current vehicle rate, add-ons, and per-stop fee.</p>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={save} disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Save changes</Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>
}
