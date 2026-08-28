"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Briefcase, Calendar as CalendarIcon, Check, Loader2, MapPin, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { applyPromotion, computeDiscount, computeFare, formatCurrency } from "@/lib/fleet"
import { createBooking, getDistanceQuote, previewPromoCode } from "@/lib/actions"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { TripMap } from "@/components/trip-map"
import type { BookingAddOn, PromoDiscountType, SitePromotion, VehicleClass } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STEPS = ["Trip", "Vehicle", "Details", "Review"] as const
// Local calendar date/time as "YYYY-MM-DD" / "HH:MM" — deliberately NOT toISOString(),
// which converts to UTC and can be a day off from the device's actual local date.
function localDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
function localTime(d: Date) { return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }
// Fixed 15-minute time slots (custom-rendered, not a native picker) so pickup time selection
// behaves identically on every device instead of depending on the OS's own time-wheel widget.
const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`)
function formatTimeLabel(value: string) {
  const [h, m] = value.split(":").map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
type AppliedPromo = { code: string; discountType: PromoDiscountType; discountValue: number }
const fromParams = (params: URLSearchParams, prefix: "pickup" | "dropoff"): PlaceSelection | null => {
  const address = params.get(`${prefix}Address`)
  const lat = Number(params.get(`${prefix}Lat`))
  const lng = Number(params.get(`${prefix}Lng`))
  return address && Number.isFinite(lat) && Number.isFinite(lng) ? { placeId: params.get(`${prefix}PlaceId`) || "", address, lat, lng } : null
}

const NO_PROMOTION: SitePromotion = { active: false, discountPercent: 0, updatedAt: "" }
export function BookingFlow({ vehicles = [], addOns = [], promotion = NO_PROMOTION }: { vehicles: VehicleClass[]; addOns: BookingAddOn[]; promotion?: SitePromotion }) {
  const router = useRouter()
  const params = useSearchParams()
  const initialPickup = fromParams(params, "pickup")
  const initialDropoff = fromParams(params, "dropoff")
  const [step, setStep] = useState(() => initialPickup && initialDropoff && params.get("pickupDate") && params.get("pickupTime") ? 1 : 0)
  const [pickup, setPickup] = useState<PlaceSelection | null>(initialPickup)
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(initialDropoff)
  const [vehicleId, setVehicleId] = useState(params.get("vehicle") || "")
  const [pickupDate, setPickupDate] = useState(params.get("pickupDate") || "")
  const [pickupTime, setPickupTime] = useState(params.get("pickupTime") || "")
  const [flightNumber, setFlightNumber] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [bags, setBags] = useState(1)
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([])
  const [customerName, setCustomerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [promoInput, setPromoInput] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [isPending, startTransition] = useTransition()
  const [promoPending, startPromoTransition] = useTransition()
  const vehicle = vehicles.find((item) => item.id === vehicleId)
  const today = localDate(new Date())

  useEffect(() => {
    if (vehicle && bags > vehicle.luggage) setBags(vehicle.luggage)
  }, [bags, vehicle])

  useEffect(() => {
    if (pickupDate && pickupDate < today) setPickupDate(today)
  }, [pickupDate, today])

  useEffect(() => {
    if (pickupDate === today && pickupTime) {
      const nowTime = localTime(new Date())
      if (pickupTime < nowTime) setPickupTime(nowTime)
    }
  }, [pickupDate, today])

  useEffect(() => {
    let active = true
    if (!pickup || !dropoff) { setDistanceMiles(null); setDurationMinutes(null); setDistanceLoading(false); return }
    setDistanceLoading(true); setDistanceMiles(null)
    void getDistanceQuote({ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng })
      .then((res) => { if (!active) return; if (res.ok && res.distanceMiles != null && res.durationMinutes != null) { setDistanceMiles(res.distanceMiles); setDurationMinutes(res.durationMinutes) } else toast.error(res.error || "Couldn't calculate this route.") })
      .catch(() => active && toast.error("Couldn't calculate this route."))
      .finally(() => active && setDistanceLoading(false))
    return () => { active = false }
  }, [pickup, dropoff])

  const quote = useMemo(() => vehicle && distanceMiles != null && durationMinutes != null ? computeFare(vehicle, distanceMiles, durationMinutes) : null, [vehicle, distanceMiles, durationMinutes])
  // The site-wide promotion (if live) discounts the vehicle fare only — add-ons and any promo code
  // still apply on top of that, so this is the one place the "real" fare is derived from.
  const vehicleFare = quote ? (promotion.active ? applyPromotion(quote.fare, promotion.discountPercent) : quote.fare) : null
  const addOnsTotal = useMemo(() => addOns.filter((addOn) => selectedAddOnIds.includes(addOn.id)).reduce((total, addOn) => total + addOn.price, 0), [addOns, selectedAddOnIds])
  const canAdvance = step === 0 ? Boolean(pickup && dropoff && pickupDate && pickupTime) : step === 1 ? Boolean(vehicleId) : step === 2 ? Boolean(customerName.trim() && email.trim() && phone.trim()) : true
  function next() { if (!canAdvance) return toast.error("Please complete the required fields to continue."); setStep((value) => Math.min(value + 1, 3)) }
  function applyPromo() {
    if (vehicleFare == null) return toast.error("Select a vehicle before applying a promo code.")
    if (!promoInput.trim()) return
    startPromoTransition(async () => {
      const res = await previewPromoCode(promoInput, vehicleFare + addOnsTotal)
      if (!res.ok || !res.code || !res.discountType || res.discountValue == null) { toast.error(res.error || "Invalid promo code."); return }
      setAppliedPromo({ code: res.code, discountType: res.discountType, discountValue: res.discountValue })
      toast.success(`Promo code ${res.code} applied.`)
    })
  }
  function removePromo() { setAppliedPromo(null); setPromoInput("") }
  function submit() {
    if (!pickup || !dropoff) return
    startTransition(async () => {
      const res = await createBooking({ direction: "custom", airportId: "custom", destinationAddress: dropoff.address, destinationLat: dropoff.lat, destinationLng: dropoff.lng, pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng, dropoffAddress: dropoff.address, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, vehicleId, pickupDate, pickupTime, flightNumber: flightNumber.trim(), passengers, bags, customerName: customerName.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim(), addOnIds: selectedAddOnIds, promoCode: appliedPromo?.code })
      if (res.ok && res.reference) router.push(`/booking/${res.reference}`)
      else { toast.error(res.error || "Something went wrong. Please try again."); if (res.error?.includes("promo code")) removePromo() }
    })
  }

  return <div className="grid gap-8 lg:grid-cols-[1fr_340px]"><div>{promotion.active && <PromotionBanner percent={promotion.discountPercent} />}<Stepper step={step} /><div className="mt-8">
    {step === 0 && <TripStep pickup={pickup} setPickup={setPickup} dropoff={dropoff} setDropoff={setDropoff} pickupDate={pickupDate} setPickupDate={setPickupDate} pickupTime={pickupTime} setPickupTime={setPickupTime} today={today} />}
    {step === 1 && <VehicleStep vehicleId={vehicleId} setVehicleId={setVehicleId} distanceMiles={distanceMiles} durationMinutes={durationMinutes} vehicles={vehicles} loading={distanceLoading} promotion={promotion} />}
    {step === 2 && <DetailsStep {...{ customerName, setCustomerName, email, setEmail, phone, setPhone, passengers, setPassengers, bags, setBags, notes, setNotes, flightNumber, setFlightNumber, addOns, selectedAddOnIds, setSelectedAddOnIds }} maxCapacity={vehicle?.capacity ?? 6} maxLuggage={vehicle?.luggage ?? 0} />}
    {step === 3 && <ReviewStep pickup={pickup?.address || ""} dropoff={dropoff?.address || ""} vehicle={vehicle?.name || ""} pickupDate={pickupDate} pickupTime={pickupTime} flightNumber={flightNumber} passengers={passengers} bags={bags} customerName={customerName} email={email} phone={phone} notes={notes} addOns={addOns.filter((addOn) => selectedAddOnIds.includes(addOn.id))} />}
  </div><div className="mt-8 flex justify-between gap-3"><Button variant="ghost" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0 || isPending}><ArrowLeft className="size-4" />Back</Button>{step < 3 ? <Button onClick={next}>Continue<ArrowRight className="size-4" /></Button> : <Button onClick={submit} disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Confirm booking</Button>}</div></div>
    <Summary pickup={pickup} dropoff={dropoff} quote={quote} vehicleFare={vehicleFare} addOnsTotal={addOnsTotal} vehicle={vehicle} pickupDate={pickupDate} pickupTime={pickupTime} promotion={promotion} promoInput={promoInput} setPromoInput={setPromoInput} appliedPromo={appliedPromo} promoPending={promoPending} onApplyPromo={applyPromo} onRemovePromo={removePromo} /></div>
}
function PromotionBanner({ percent }: { percent: number }) { return <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"><Sparkles className="size-4 shrink-0" />Limited-time offer: {percent}% off every fare — the discount is already applied below.</div> }

function Stepper({ step }: { step: number }) { return <ol className="flex items-center gap-2">{STEPS.map((label, index) => <li key={label} className="flex flex-1 items-center gap-2"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium", index < step && "border-primary bg-primary text-primary-foreground", index === step && "border-primary text-primary")}>{index < step ? <Check className="size-4" /> : index + 1}</span><span className="hidden text-sm font-medium sm:block">{label}</span>{index < 3 && <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />}</li>)}</ol> }
function Heading({ title, desc }: { title: string; desc: string }) { return <div className="mb-5"><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div> }
function TripStep({ pickup, setPickup, dropoff, setDropoff, pickupDate, setPickupDate, pickupTime, setPickupTime, today }: { pickup: PlaceSelection | null; setPickup: (value: PlaceSelection | null) => void; dropoff: PlaceSelection | null; setDropoff: (value: PlaceSelection | null) => void; pickupDate: string; setPickupDate: (value: string) => void; pickupTime: string; setPickupTime: (value: string) => void; today: string }) {
  const [dateOpen, setDateOpen] = useState(false)
  const isToday = pickupDate === today
  const nowTime = localTime(new Date())
  const availableTimes = isToday ? TIME_SLOTS.filter((t) => t >= nowTime) : TIME_SLOTS
  function handleDateChange(value: string) {
    if (value && value < today) { toast.error("Pickup date can't be in the past."); setPickupDate(today); return }
    setPickupDate(value)
  }
  function handleTimeChange(value: string) {
    if (isToday && value && value < nowTime) { toast.error("Pickup time can't be in the past."); setPickupTime(nowTime); return }
    setPickupTime(value)
  }
  return <div><Heading title="Plan your trip" desc="Choose your pickup and drop-off locations from Google Maps." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Pickup location"><DestinationPicker defaultValue={pickup?.address} placeholder="Start typing a pickup address" onSelect={setPickup} onClear={() => setPickup(null)} /></Field><Field label="Drop-off location"><DestinationPicker defaultValue={dropoff?.address} placeholder="Start typing a drop-off address" onSelect={setDropoff} onClear={() => setDropoff(null)} /></Field><Field label="Pickup date">
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
  </Field><Field label="Pickup time">
    <Select value={pickupTime} onValueChange={handleTimeChange}>
      <SelectTrigger className="w-full"><SelectValue placeholder="Select time" /></SelectTrigger>
      <SelectContent>{availableTimes.map((t) => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}</SelectContent>
    </Select>
  </Field></div></div>
}
function VehicleStep({ vehicleId, setVehicleId, distanceMiles, durationMinutes, vehicles, loading, promotion }: { vehicleId: string; setVehicleId: (value: string) => void; distanceMiles: number | null; durationMinutes: number | null; vehicles: VehicleClass[]; loading: boolean; promotion: SitePromotion }) { return <div><Heading title="Pick your vehicle" desc={loading ? "Calculating your route…" : "Fares are fixed and include all taxes, tolls, and gratuity."} /><div className="grid gap-4 sm:grid-cols-2">{vehicles.map((item) => { const quote = distanceMiles != null && durationMinutes != null ? computeFare(item, distanceMiles, durationMinutes) : null; const originalPrice = quote ? quote.fare : item.minFare; const price = promotion.active ? applyPromotion(originalPrice, promotion.discountPercent) : originalPrice; const selected = item.id === vehicleId; return <button key={item.id} type="button" onClick={() => setVehicleId(item.id)} className={cn("flex gap-4 rounded-2xl border p-4 text-left", selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card")}><div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-secondary"><Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" sizes="96px" /></div><div><h3 className="font-semibold">{item.name}</h3><div className="mt-1 flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="size-3.5" />{item.capacity}</span><span className="flex items-center gap-1"><Briefcase className="size-3.5" />{item.luggage}</span></div><div className="mt-2 flex items-baseline gap-1.5">{promotion.active && <span className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>}<span className={cn("font-semibold", promotion.active && "text-primary")}>{quote ? formatCurrency(price) : `from ${formatCurrency(price)}`}</span></div>{promotion.active && <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{promotion.discountPercent}% off</span>}</div></button> })}</div></div> }
function DetailsStep(props: any) { return <div><Heading title="Passenger details" desc="We'll send your confirmation and driver details to your email." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={props.customerName} onChange={(e) => props.setCustomerName(e.target.value)} /></Field><Field label="Email"><Input type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} /></Field><Field label="Phone"><Input type="tel" value={props.phone} onChange={(e) => props.setPhone(e.target.value)} /></Field><Field label="Flight number (optional)"><Input value={props.flightNumber} onChange={(e) => props.setFlightNumber(e.target.value.toUpperCase())} /></Field><Field label="Passengers"><Select value={String(props.passengers)} onValueChange={(value) => props.setPassengers(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: props.maxCapacity }, (_, index) => index + 1).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></Field><Field label="Bags"><Select value={String(Math.min(props.bags, props.maxLuggage))} onValueChange={(value) => props.setBags(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: props.maxLuggage + 1 }, (_, index) => index).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></Field><div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Trip add-ons</p><div className="grid gap-2 sm:grid-cols-2">{props.addOns.map((addOn: BookingAddOn) => { const checked = props.selectedAddOnIds.includes(addOn.id); return <label key={addOn.id} className="flex cursor-pointer items-center justify-between rounded-xl border p-3"><span className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={() => props.setSelectedAddOnIds(checked ? props.selectedAddOnIds.filter((id: string) => id !== addOn.id) : [...props.selectedAddOnIds, addOn.id])} />{addOn.name}</span><span className="font-medium">{formatCurrency(addOn.price)}</span></label> })}</div></div><div className="sm:col-span-2"><Field label="Notes for your driver (optional)"><Textarea value={props.notes} onChange={(e) => props.setNotes(e.target.value)} rows={3} /></Field></div></div></div> }
function ReviewStep(props: any) { return <div><Heading title="Review your trip" desc="Double-check the details below, then confirm your booking." /><div className="divide-y rounded-2xl border bg-card">{[["Route", `${props.pickup} → ${props.dropoff}`], ["Vehicle", props.vehicle], ["Pickup", `${formatDate(props.pickupDate)} at ${props.pickupTime}`], ["Party", `${props.passengers} passenger(s), ${props.bags} bag(s)`], ["Add-ons", props.addOns.length ? props.addOns.map((addOn: BookingAddOn) => `${addOn.name} (${formatCurrency(addOn.price)})`).join(", ") : "None"], ["Passenger", props.customerName], ["Contact", `${props.email} · ${props.phone}`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 px-5 py-3.5 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>)}</div></div> }
function Summary({ pickup, dropoff, quote, vehicleFare, addOnsTotal, vehicle, pickupDate, pickupTime, promotion, promoInput, setPromoInput, appliedPromo, promoPending, onApplyPromo, onRemovePromo }: { pickup: PlaceSelection | null; dropoff: PlaceSelection | null; quote: ReturnType<typeof computeFare> | null; vehicleFare: number | null; addOnsTotal: number; vehicle?: VehicleClass; pickupDate: string; pickupTime: string; promotion: SitePromotion; promoInput: string; setPromoInput: (value: string) => void; appliedPromo: AppliedPromo | null; promoPending: boolean; onApplyPromo: () => void; onRemovePromo: () => void }) {
  const subtotal = vehicleFare != null ? vehicleFare + addOnsTotal : null
  const discountAmount = subtotal != null && appliedPromo ? computeDiscount(subtotal, appliedPromo) : 0
  const total = subtotal != null ? subtotal - discountAmount : null
  return <aside className="h-fit space-y-4 lg:sticky lg:top-24">{pickup && dropoff && <TripMap originLat={pickup.lat} originLng={pickup.lng} originLabel={pickup.address} originTime={pickupTime || undefined} destLat={dropoff.lat} destLng={dropoff.lng} destLabel={dropoff.address} /> }<div className="rounded-2xl border border-border/70 bg-card p-5"><h3 className="font-semibold">Trip summary</h3><div className="mt-4 space-y-3 text-sm"><Line label="Pickup" value={pickup?.address || "—"} /><Line label="Drop-off" value={dropoff?.address || "—"} /><Line label="When" value={pickupDate ? `${formatDate(pickupDate)} · ${pickupTime}` : "—"} /><Line label="Vehicle" value={vehicle?.name || "—"} />{quote && promotion.active && vehicleFare != null && vehicleFare !== quote.fare && <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">Fare</span><span className="text-right font-medium"><span className="mr-1.5 text-muted-foreground line-through">{formatCurrency(quote.fare)}</span><span className="text-primary">{formatCurrency(vehicleFare)}</span></span></div>}{addOnsTotal > 0 && <Line label="Add-ons" value={formatCurrency(addOnsTotal)} />}{appliedPromo && discountAmount > 0 && <Line label={`Promo (${appliedPromo.code})`} value={`-${formatCurrency(discountAmount)}`} />}</div>{quote && <div className="mt-4 border-t pt-4">{appliedPromo ? <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm font-medium">{appliedPromo.code}</span><Button size="sm" variant="ghost" onClick={onRemovePromo}>Remove</Button></div> : <div className="flex gap-2"><Input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Promo code" className="flex-1" /><Button size="sm" variant="outline" disabled={promoPending || !promoInput.trim()} onClick={onApplyPromo}>{promoPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}</Button></div>}</div>}<div className="mt-5 border-t pt-4"><div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">Total fare</span><span className="text-2xl font-semibold">{total != null ? formatCurrency(total) : "—"}</span></div>{promotion.active && <p className="mt-1 text-right text-xs text-primary">Includes {promotion.discountPercent}% site-wide discount</p>}</div></div></aside>
}
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div> }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "" }
