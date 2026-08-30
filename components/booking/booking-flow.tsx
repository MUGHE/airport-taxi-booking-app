"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Banknote, Briefcase, Calendar as CalendarIcon, Check, CreditCard, Loader2, MapPin, MapPinPlus, Repeat, Sparkles, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { applyPromotion, computeDiscount, computeFare, formatCurrency } from "@/lib/fleet"
import { createBooking, createReturnBooking, getDistanceQuote, previewPromoCode } from "@/lib/actions"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { TripMap } from "@/components/trip-map"
import type { BookingAddOn, PaymentMethod, PromoDiscountType, ReturnTripDiscount, SitePromotion, StopPricing, VehicleClass } from "@/lib/types"
import { cn } from "@/lib/utils"
import { BOOKING_LEAD_MINUTES, formatDate, formatTimeLabel, localDate, minPickupTimeToday, TIME_SLOTS } from "@/lib/datetime"
import { toast } from "sonner"

const STEPS = ["Trip", "Vehicle", "Details", "Review"] as const
type AppliedPromo = { code: string; discountType: PromoDiscountType; discountValue: number }
const fromParams = (params: URLSearchParams, prefix: "pickup" | "dropoff"): PlaceSelection | null => {
  const address = params.get(`${prefix}Address`)
  const lat = Number(params.get(`${prefix}Lat`))
  const lng = Number(params.get(`${prefix}Lng`))
  return address && Number.isFinite(lat) && Number.isFinite(lng) ? { placeId: params.get(`${prefix}PlaceId`) || "", address, lat, lng } : null
}
// Stops picked on the homepage widget arrive as a JSON-encoded query param.
const stopsFromParams = (params: URLSearchParams): PlaceSelection[] => {
  const raw = params.get("stops")
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is PlaceSelection => s && typeof s.address === "string" && Number.isFinite(s.lat) && Number.isFinite(s.lng))
  } catch {
    return []
  }
}

const NO_PROMOTION: SitePromotion = { active: false, discountPercent: 0, updatedAt: "" }
const NO_RETURN_DISCOUNT: ReturnTripDiscount = { active: false, discountPercent: 0, updatedAt: "" }
const NO_STOP_PRICING: StopPricing = { pricePerStop: 0, updatedAt: "" }
// Mirrors the server-side cap in lib/actions.ts — keep the two in sync.
const MAX_STOPS = 3
export function BookingFlow({ vehicles = [], addOns = [], promotion = NO_PROMOTION, returnDiscount = NO_RETURN_DISCOUNT, stopPricing = NO_STOP_PRICING }: { vehicles: VehicleClass[]; addOns: BookingAddOn[]; promotion?: SitePromotion; returnDiscount?: ReturnTripDiscount; stopPricing?: StopPricing }) {
  const router = useRouter()
  const params = useSearchParams()
  const initialPickup = fromParams(params, "pickup")
  const initialDropoff = fromParams(params, "dropoff")
  const [step, setStep] = useState(() => initialPickup && initialDropoff && params.get("pickupDate") && params.get("pickupTime") ? 1 : 0)
  const [pickup, setPickup] = useState<PlaceSelection | null>(initialPickup)
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(initialDropoff)
  const [stops, setStops] = useState<PlaceSelection[]>(() => stopsFromParams(params))
  const [vehicleId, setVehicleId] = useState(params.get("vehicle") || "")
  const [pickupDate, setPickupDate] = useState(params.get("pickupDate") || "")
  const [pickupTime, setPickupTime] = useState(params.get("pickupTime") || "")
  const [wantsReturn, setWantsReturn] = useState(false)
  const [returnDate, setReturnDate] = useState("")
  const [returnTime, setReturnTime] = useState("")
  const [returnAddressSame, setReturnAddressSame] = useState(true)
  const [returnPickup, setReturnPickup] = useState<PlaceSelection | null>(null)
  const [returnDropoff, setReturnDropoff] = useState<PlaceSelection | null>(null)
  const [flightNumber, setFlightNumber] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [bags, setBags] = useState(1)
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([])
  const [customerName, setCustomerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
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
      const minTime = minPickupTimeToday()
      if (pickupTime < minTime) setPickupTime(minTime)
    }
  }, [pickupDate, today])

  // A return trip can't depart before the outbound one — re-validate whenever either
  // date/time changes, same reasoning as the pickup-date/time effects above.
  useEffect(() => {
    if (wantsReturn && returnDate && pickupDate && returnDate < pickupDate) setReturnDate(pickupDate)
  }, [wantsReturn, returnDate, pickupDate])

  useEffect(() => {
    if (wantsReturn && returnDate === pickupDate && returnTime && pickupTime && returnTime < pickupTime) setReturnTime(pickupTime)
  }, [wantsReturn, returnDate, pickupDate, returnTime, pickupTime])

  useEffect(() => {
    if (wantsReturn && returnDate === today && returnTime) {
      const minTime = minPickupTimeToday()
      if (returnTime < minTime) setReturnTime(minTime)
    }
  }, [wantsReturn, returnDate, today])

  // Stops change distance/duration (and so the fare), so the route must be recalculated
  // whenever they're added, removed, or edited — not just when pickup/drop-off change.
  const stopsKey = stops.map((s) => `${s.lat},${s.lng}`).join("|")
  useEffect(() => {
    let active = true
    if (!pickup || !dropoff) { setDistanceMiles(null); setDurationMinutes(null); setDistanceLoading(false); return }
    setDistanceLoading(true); setDistanceMiles(null)
    void getDistanceQuote({ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng }, stops.map((s) => ({ lat: s.lat, lng: s.lng })))
      .then((res) => { if (!active) return; if (res.ok && res.distanceMiles != null && res.durationMinutes != null) { setDistanceMiles(res.distanceMiles); setDurationMinutes(res.durationMinutes) } else toast.error(res.error || "Couldn't calculate this route.") })
      .catch(() => active && toast.error("Couldn't calculate this route."))
      .finally(() => active && setDistanceLoading(false))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, dropoff, stopsKey])

  const quote = useMemo(() => vehicle && distanceMiles != null && durationMinutes != null ? computeFare(vehicle, distanceMiles, durationMinutes) : null, [vehicle, distanceMiles, durationMinutes])
  // The site-wide promotion (if live) discounts the vehicle fare only — add-ons, stops, and any
  // promo code still apply on top of that, so this is the one place the "real" fare is derived from.
  const vehicleFare = quote ? (promotion.active ? applyPromotion(quote.fare, promotion.discountPercent) : quote.fare) : null
  const addOnsTotal = useMemo(() => addOns.filter((addOn) => selectedAddOnIds.includes(addOn.id)).reduce((total, addOn) => total + addOn.price, 0), [addOns, selectedAddOnIds])
  const stopsTotal = stops.length * stopPricing.pricePerStop
  // "Same as above" just reverses the outbound trip; otherwise the customer picks their own
  // return locations (e.g. flying home from a different airport than they arrived at).
  const effectiveReturnPickup = returnAddressSame ? dropoff : returnPickup
  const effectiveReturnDropoff = returnAddressSame ? pickup : returnDropoff
  const canAdvance = step === 0 ? Boolean(pickup && dropoff && pickupDate && pickupTime) : step === 1 ? Boolean(vehicleId) : step === 2 ? Boolean(customerName.trim() && email.trim() && phone.trim() && (!wantsReturn || (returnDate && returnTime && effectiveReturnPickup && effectiveReturnDropoff))) : true
  // Return-leg fare estimate — computed as soon as the vehicle (and its fare) is known, not
  // gated on wantsReturn, so the Details step can show the savings before it's even checked.
  const returnFareEstimate = vehicleFare != null ? (returnDiscount.active ? applyPromotion(vehicleFare, returnDiscount.discountPercent) : vehicleFare) : null
  function next() { if (!canAdvance) return toast.error("Please complete the required fields to continue."); setStep((value) => Math.min(value + 1, 3)) }
  function applyPromo() {
    if (vehicleFare == null) return toast.error("Select a vehicle before applying a promo code.")
    if (!promoInput.trim()) return
    startPromoTransition(async () => {
      const res = await previewPromoCode(promoInput, vehicleFare + addOnsTotal + stopsTotal)
      if (!res.ok || !res.code || !res.discountType || res.discountValue == null) { toast.error(res.error || "Invalid promo code."); return }
      setAppliedPromo({ code: res.code, discountType: res.discountType, discountValue: res.discountValue })
      toast.success(`Promo code ${res.code} applied.`)
    })
  }
  function removePromo() { setAppliedPromo(null); setPromoInput("") }
  function submit() {
    if (!pickup || !dropoff) return
    if (wantsReturn && (!returnDate || !returnTime)) return toast.error("Choose a date and time for your return trip.")
    if (wantsReturn && !returnAddressSame && (!returnPickup || !returnDropoff)) return toast.error("Choose pickup and drop-off addresses for your return trip.")
    startTransition(async () => {
      const res = await createBooking({ direction: "custom", airportId: "custom", destinationAddress: dropoff.address, destinationLat: dropoff.lat, destinationLng: dropoff.lng, pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng, dropoffAddress: dropoff.address, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, vehicleId, pickupDate, pickupTime, flightNumber: flightNumber.trim(), passengers, bags, customerName: customerName.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim(), addOnIds: selectedAddOnIds, stops, promoCode: appliedPromo?.code, paymentMethod })
      if (!res.ok || !res.reference) { toast.error(res.error || "Something went wrong. Please try again."); if (res.error?.includes("promo code")) removePromo(); return }

      if (wantsReturn && effectiveReturnPickup && effectiveReturnDropoff) {
        // "Same as above" simply swaps the outbound pickup/drop-off; otherwise the
        // customer-chosen return locations are used as-is. No add-ons or promo code
        // carry over — the return-trip discount (if any) is applied server-side instead.
        const returnRes = await createReturnBooking(res.reference, { direction: "custom", airportId: "custom", destinationAddress: effectiveReturnDropoff.address, destinationLat: effectiveReturnDropoff.lat, destinationLng: effectiveReturnDropoff.lng, pickupAddress: effectiveReturnPickup.address, pickupLat: effectiveReturnPickup.lat, pickupLng: effectiveReturnPickup.lng, dropoffAddress: effectiveReturnDropoff.address, dropoffLat: effectiveReturnDropoff.lat, dropoffLng: effectiveReturnDropoff.lng, vehicleId, pickupDate: returnDate, pickupTime: returnTime, flightNumber: "", passengers, bags, customerName: customerName.trim(), email: email.trim(), phone: phone.trim(), notes: "", addOnIds: [], stops: [], paymentMethod })
        if (!returnRes.ok) toast.error(returnRes.error || "Your booking is confirmed, but we couldn't add the return trip. Please book it separately.")
      }

      router.push(`/booking/${res.reference}`)
    })
  }

  return <div className="grid gap-8 lg:grid-cols-[1fr_340px]"><div>{promotion.active && <PromotionBanner percent={promotion.discountPercent} />}<Stepper step={step} /><div className="mt-8">
    {step === 0 && <TripStep pickup={pickup} setPickup={setPickup} dropoff={dropoff} setDropoff={setDropoff} pickupDate={pickupDate} setPickupDate={setPickupDate} pickupTime={pickupTime} setPickupTime={setPickupTime} today={today} stops={stops} setStops={setStops} stopPricing={stopPricing} />}
    {step === 1 && <VehicleStep vehicleId={vehicleId} setVehicleId={setVehicleId} distanceMiles={distanceMiles} durationMinutes={durationMinutes} vehicles={vehicles} loading={distanceLoading} promotion={promotion} />}
    {step === 2 && <DetailsStep {...{ customerName, setCustomerName, email, setEmail, phone, setPhone, passengers, setPassengers, bags, setBags, notes, setNotes, flightNumber, setFlightNumber, addOns, selectedAddOnIds, setSelectedAddOnIds, pickup, dropoff, pickupDate, pickupTime, today, wantsReturn, setWantsReturn, returnDate, setReturnDate, returnTime, setReturnTime, returnDiscount, returnAddressSame, setReturnAddressSame, returnPickup, setReturnPickup, returnDropoff, setReturnDropoff, vehicleFare, returnFare: returnFareEstimate }} maxCapacity={vehicle?.capacity ?? 6} maxLuggage={vehicle?.luggage ?? 0} />}
    {step === 3 && <ReviewStep pickup={pickup?.address || ""} dropoff={dropoff?.address || ""} stops={stops} stopsTotal={stopsTotal} vehicle={vehicle?.name || ""} pickupDate={pickupDate} pickupTime={pickupTime} flightNumber={flightNumber} passengers={passengers} bags={bags} customerName={customerName} email={email} phone={phone} notes={notes} addOns={addOns.filter((addOn) => selectedAddOnIds.includes(addOn.id))} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} wantsReturn={wantsReturn} returnDate={returnDate} returnTime={returnTime} returnFare={returnFareEstimate} returnDiscount={returnDiscount} returnPickupAddress={effectiveReturnPickup?.address || ""} returnDropoffAddress={effectiveReturnDropoff?.address || ""} />}
  </div><div className="mt-8 flex justify-between gap-3"><Button variant="ghost" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0 || isPending}><ArrowLeft className="size-4" />Back</Button>{step < 3 ? <Button onClick={next}>Continue<ArrowRight className="size-4" /></Button> : <Button onClick={submit} disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Confirm booking</Button>}</div></div>
    <Summary pickup={pickup} dropoff={dropoff} stops={stops} stopsTotal={stopsTotal} quote={quote} vehicleFare={vehicleFare} addOnsTotal={addOnsTotal} vehicle={vehicle} pickupDate={pickupDate} pickupTime={pickupTime} promotion={promotion} promoInput={promoInput} setPromoInput={setPromoInput} appliedPromo={appliedPromo} promoPending={promoPending} onApplyPromo={applyPromo} onRemovePromo={removePromo} wantsReturn={wantsReturn} returnDate={returnDate} returnTime={returnTime} returnFare={returnFareEstimate} returnDiscount={returnDiscount} /></div>
}
function PromotionBanner({ percent }: { percent: number }) { return <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"><Sparkles className="size-4 shrink-0" />Limited-time offer: {percent}% off every fare — the discount is already applied below.</div> }

function Stepper({ step }: { step: number }) { return <ol className="flex items-center gap-2">{STEPS.map((label, index) => <li key={label} className="flex flex-1 items-center gap-2"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium", index < step && "border-primary bg-primary text-primary-foreground", index === step && "border-primary text-primary")}>{index < step ? <Check className="size-4" /> : index + 1}</span><span className="hidden text-sm font-medium sm:block">{label}</span>{index < 3 && <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />}</li>)}</ol> }
function Heading({ title, desc }: { title: string; desc: string }) { return <div className="mb-5"><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div> }
function TripStep({ pickup, setPickup, dropoff, setDropoff, pickupDate, setPickupDate, pickupTime, setPickupTime, today, stops, setStops, stopPricing }: { pickup: PlaceSelection | null; setPickup: (value: PlaceSelection | null) => void; dropoff: PlaceSelection | null; setDropoff: (value: PlaceSelection | null) => void; pickupDate: string; setPickupDate: (value: string) => void; pickupTime: string; setPickupTime: (value: string) => void; today: string; stops: PlaceSelection[]; setStops: (value: PlaceSelection[]) => void; stopPricing: StopPricing }) {
  const [dateOpen, setDateOpen] = useState(false)
  const isToday = pickupDate === today
  // Same-day pickups need lead time to prepare a vehicle and driver — the earliest
  // selectable slot is "now" plus a buffer, not "now" itself.
  const minTimeToday = minPickupTimeToday()
  const availableTimes = isToday ? TIME_SLOTS.filter((t) => t >= minTimeToday) : TIME_SLOTS
  function handleDateChange(value: string) {
    if (value && value < today) { toast.error("Pickup date can't be in the past."); setPickupDate(today); return }
    setPickupDate(value)
  }
  function handleTimeChange(value: string) {
    if (isToday && value && value < minTimeToday) { toast.error(`Pickup time must be at least ${BOOKING_LEAD_MINUTES} minutes from now.`); setPickupTime(minTimeToday); return }
    setPickupTime(value)
  }
  function addStop() { if (stops.length < MAX_STOPS) setStops([...stops, { placeId: "", address: "", lat: NaN, lng: NaN }]) }
  function updateStop(index: number, value: PlaceSelection) { setStops(stops.map((s, i) => (i === index ? value : s))) }
  function removeStop(index: number) { setStops(stops.filter((_, i) => i !== index)) }
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
    <Select value={pickupTime} onValueChange={(value) => { if (value) handleTimeChange(value) }}>
      <SelectTrigger className="w-full"><SelectValue placeholder="Select time" /></SelectTrigger>
      <SelectContent>{availableTimes.map((t) => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}</SelectContent>
    </Select>
  </Field></div>
  <div className="mt-6">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium">Stops along the way (optional)</p>
      {stopPricing.pricePerStop > 0 && <span className="text-xs text-muted-foreground">+{formatCurrency(stopPricing.pricePerStop)} per stop</span>}
    </div>
    {stops.length > 0 && <div className="mt-2 space-y-2">
      {stops.map((stop, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">{index + 1}</span>
          <div className="flex-1"><DestinationPicker defaultValue={stop.address} placeholder={`Stop ${index + 1} address`} onSelect={(place) => updateStop(index, place)} onClear={() => updateStop(index, { placeId: "", address: "", lat: NaN, lng: NaN })} /></div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeStop(index)} aria-label={`Remove stop ${index + 1}`}><X className="size-4" /></Button>
        </div>
      ))}
    </div>}
    {stops.length < MAX_STOPS && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addStop}><MapPinPlus className="size-4" />Add a stop</Button>}
  </div>
  </div>
}
function VehicleStep({ vehicleId, setVehicleId, distanceMiles, durationMinutes, vehicles, loading, promotion }: { vehicleId: string; setVehicleId: (value: string) => void; distanceMiles: number | null; durationMinutes: number | null; vehicles: VehicleClass[]; loading: boolean; promotion: SitePromotion }) { return <div><Heading title="Pick your vehicle" desc={loading ? "Calculating your route…" : "Fares are fixed and include all taxes, tolls, and gratuity."} /><div className="grid gap-4 sm:grid-cols-2">{vehicles.map((item, index) => { const quote = distanceMiles != null && durationMinutes != null ? computeFare(item, distanceMiles, durationMinutes) : null; const originalPrice = quote ? quote.fare : item.minFare; const price = promotion.active ? applyPromotion(originalPrice, promotion.discountPercent) : originalPrice; const selected = item.id === vehicleId;
        // Unselected cards stay the same white card + secondary image panel as the selected one —
        // selection is a soft primary halo + corner check mark, not a competing flat-color fill.
        return <button key={item.id} type="button" onClick={() => setVehicleId(item.id)}
          className={cn("animate-card-in overflow-hidden rounded-2xl border bg-card text-left", selected ? "border-primary" : "border-border")}
          style={{ borderWidth: selected ? "1.5px" : "1px", boxShadow: selected ? "0 0 0 3px oklch(0.48 0.16 256 / 0.12), 0 6px 16px oklch(0.48 0.16 256 / 0.14)" : "0 1px 2px oklch(0.21 0.03 256 / 0.04)", animationDelay: `${index * 150}ms` }}>
          <div className="relative aspect-[4/3] bg-secondary">
            <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-contain p-1.5" sizes="(max-width: 640px) 100vw, 320px" />
            {selected && <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-primary shadow-sm"><Check className="size-3.5 text-primary-foreground" strokeWidth={3} /></span>}
          </div>
          <div className="p-4"><h3 className="font-semibold">{item.name}</h3><div className="mt-1 flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="size-3.5" />{item.capacity}</span><span className="flex items-center gap-1"><Briefcase className="size-3.5" />{item.luggage}</span></div><div className="my-3 border-t border-border" /><div className="flex items-baseline gap-1.5">{promotion.active && <span className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>}<span className={cn("font-semibold", promotion.active && "text-primary")}>{quote ? formatCurrency(price) : `from ${formatCurrency(price)}`}</span></div>{promotion.active && <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{promotion.discountPercent}% off</span>}</div></button> })}</div></div> }
function DetailsStep(props: any) { return <div><Heading title="Passenger details" desc="We'll send your confirmation and driver details to your email." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={props.customerName} onChange={(e) => props.setCustomerName(e.target.value)} /></Field><Field label="Email"><Input type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} /></Field><Field label="Phone"><Input type="tel" value={props.phone} onChange={(e) => props.setPhone(e.target.value)} /></Field><Field label="Flight number (optional)"><Input value={props.flightNumber} onChange={(e) => props.setFlightNumber(e.target.value.toUpperCase())} /></Field><Field label="Passengers"><Select value={String(props.passengers)} onValueChange={(value) => props.setPassengers(Number(value))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: props.maxCapacity }, (_, index) => index + 1).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></Field><Field label="Bags"><Select value={String(Math.min(props.bags, props.maxLuggage))} onValueChange={(value) => props.setBags(Number(value))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: props.maxLuggage + 1 }, (_, index) => index).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></Field><div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Trip add-ons</p><div className="grid gap-2 sm:grid-cols-2">{props.addOns.map((addOn: BookingAddOn) => {
              const checked = props.selectedAddOnIds.includes(addOn.id)
              // Same selectable-card language as the payment method picker below (border-primary +
              // ring + tint when picked) instead of a bare, unstyled native checkbox.
              return <label key={addOn.id} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-sm", checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card")}>
                <span className="flex items-center gap-3">
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => props.setSelectedAddOnIds(checked ? props.selectedAddOnIds.filter((id: string) => id !== addOn.id) : [...props.selectedAddOnIds, addOn.id])} />
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}><Check className="size-3.5" strokeWidth={3} /></span>
                  <span className="font-medium">{addOn.name}</span>
                </span>
                <span className={cn("font-medium", checked && "text-primary")}>{formatCurrency(addOn.price)}</span>
              </label>
            })}</div></div><div className="sm:col-span-2"><Field label="Notes for your driver (optional)"><Textarea value={props.notes} onChange={(e) => props.setNotes(e.target.value)} rows={3} /></Field></div></div><ReturnTripOption {...props} /></div> }
function ReturnTripOption(props: any) {
  const [returnDateOpen, setReturnDateOpen] = useState(false)
  const { pickup, dropoff, pickupDate, pickupTime, today, wantsReturn, setWantsReturn, returnDate, setReturnDate, returnTime, setReturnTime, returnDiscount, returnAddressSame, setReturnAddressSame, returnPickup, setReturnPickup, returnDropoff, setReturnDropoff, vehicleFare, returnFare } = props
  const minTimeToday = minPickupTimeToday()
  const minReturnDate = pickupDate || today
  // The return leg can't start before the outbound one lands — floor is whichever of
  // "now" plus the lead-time buffer (if the return date is today) and the outbound pickup
  // time (if same day) is later.
  const returnFloorTime = [pickupDate && returnDate === pickupDate ? pickupTime : null, returnDate === today ? minTimeToday : null]
    .filter((t: string | null): t is string => Boolean(t))
    .reduce((max: string | null, t: string) => (max == null || t > max ? t : max), null as string | null)
  const returnAvailableTimes = returnFloorTime ? TIME_SLOTS.filter((t) => t >= returnFloorTime) : TIME_SLOTS
  function handleReturnDateChange(value: string) {
    if (value && minReturnDate && value < minReturnDate) { toast.error("Return date can't be before your pickup date."); setReturnDate(minReturnDate); return }
    setReturnDate(value)
  }
  function handleReturnTimeChange(value: string) {
    if (returnFloorTime && value && value < returnFloorTime) { toast.error("Return time can't be before your pickup."); setReturnTime(returnFloorTime); return }
    setReturnTime(value)
  }
  const savings = vehicleFare != null && returnFare != null ? vehicleFare - returnFare : 0

  return <div className={cn("mt-6 rounded-2xl border-2 p-4 sm:p-5", wantsReturn ? "border-primary bg-primary/5" : "border-primary/40 bg-primary/5")}>
    <label className="flex cursor-pointer items-start gap-3">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Repeat className="size-5" />
      </span>
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold">Add a return trip</span>
          {returnDiscount.active && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{returnDiscount.discountPercent}% OFF</span>}
        </span>
        <span className="mt-1 block text-sm font-medium text-foreground">
          {returnDiscount.active && savings > 0
            ? `Book now and save ${formatCurrency(savings)} on your return leg.`
            : returnDiscount.active
              ? `Save ${returnDiscount.discountPercent}% on your return leg.`
              : "We'll drive you back too — just pick a date, time, and locations."}
        </span>
      </span>
      {/* Same custom rounded checkbox as the trip add-ons below, instead of the browser's square
          native one. */}
      <input type="checkbox" className="sr-only" checked={wantsReturn} onChange={(e) => setWantsReturn(e.target.checked)} />
      <span className={cn("mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-md border", wantsReturn ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-transparent")}><Check className="size-3.5" strokeWidth={3} /></span>
    </label>
    {wantsReturn && <div className="mt-4 border-t border-primary/20 pt-4">
      <p className="mb-2 text-sm font-medium">Return locations</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setReturnAddressSame(true)} className={cn("rounded-xl border p-3 text-left text-sm", returnAddressSame ? "border-primary bg-primary/5 ring-1 ring-primary font-medium" : "border-border bg-card text-muted-foreground")}>
          Same as above (reversed)
          {returnAddressSame && dropoff && pickup && <span className="mt-0.5 block text-xs text-muted-foreground">{dropoff.address} → {pickup.address}</span>}
        </button>
        <button type="button" onClick={() => setReturnAddressSame(false)} className={cn("rounded-xl border p-3 text-left text-sm", !returnAddressSame ? "border-primary bg-primary/5 ring-1 ring-primary font-medium" : "border-border bg-card text-muted-foreground")}>
          Different addresses
        </button>
      </div>
      {!returnAddressSame && <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Return pickup location"><DestinationPicker defaultValue={returnPickup?.address} placeholder="Start typing a pickup address" onSelect={setReturnPickup} onClear={() => setReturnPickup(null)} /></Field>
        <Field label="Return drop-off location"><DestinationPicker defaultValue={returnDropoff?.address} placeholder="Start typing a drop-off address" onSelect={setReturnDropoff} onClear={() => setReturnDropoff(null)} /></Field>
      </div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Return date">
          <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
            <PopoverTrigger render={<Button variant="outline" className="w-full justify-start gap-2 font-normal" />}>
              <CalendarIcon className="size-4 text-muted-foreground" />
              {returnDate ? formatDate(returnDate) : "Select date"}
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                required
                selected={returnDate ? new Date(`${returnDate}T00:00:00`) : undefined}
                onSelect={(date) => { if (!date) return; handleReturnDateChange(localDate(date)); setReturnDateOpen(false) }}
                disabled={{ before: new Date(`${minReturnDate}T00:00:00`) }}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field label="Return time">
          <Select value={returnTime} onValueChange={(value) => { if (value) handleReturnTimeChange(value) }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select time" /></SelectTrigger>
            <SelectContent>{returnAvailableTimes.map((t) => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      {returnFare != null && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/10 px-3.5 py-2.5">
        <span className="text-sm font-medium">Estimated return fare</span>
        <span className="flex items-baseline gap-1.5">
          {savings > 0 && <span className="text-sm text-muted-foreground line-through">{formatCurrency(returnFare + savings)}</span>}
          <span className="text-lg font-semibold text-primary">{formatCurrency(returnFare)}</span>
          {savings > 0 && <span className="text-xs font-medium text-primary">save {formatCurrency(savings)}</span>}
        </span>
      </div>}
    </div>}
  </div>
}
function ReviewStep(props: any) { return <div><Heading title="Review your trip" desc="Double-check the details below, then confirm your booking." /><div className="divide-y rounded-2xl border bg-card">{[["Route", `${props.pickup} → ${props.dropoff}`], ...(props.stops.length ? [["Stops", `${props.stops.map((s: PlaceSelection, i: number) => `${i + 1}. ${s.address}`).join(", ")}${props.stopsTotal > 0 ? ` (+${formatCurrency(props.stopsTotal)})` : ""}`]] : []), ["Vehicle", props.vehicle], ["Pickup", `${formatDate(props.pickupDate)} at ${props.pickupTime}`], ["Party", `${props.passengers} passenger(s), ${props.bags} bag(s)`], ["Add-ons", props.addOns.length ? props.addOns.map((addOn: BookingAddOn) => `${addOn.name} (${formatCurrency(addOn.price)})`).join(", ") : "None"], ["Passenger", props.customerName], ["Contact", `${props.email} · ${props.phone}`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 px-5 py-3.5 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>)}</div>
  {props.wantsReturn && <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-sm font-semibold"><Repeat className="size-4 text-primary" />Return trip</span>
      {props.returnDiscount.active && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{props.returnDiscount.discountPercent}% off</span>}
    </div>
    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
      <p>{props.returnPickupAddress} → {props.returnDropoffAddress}</p>
      <p>{formatDate(props.returnDate)} at {props.returnTime}</p>
    </div>
    {props.returnFare != null && <p className="mt-2 text-sm font-medium">Estimated fare: {formatCurrency(props.returnFare)}</p>}
  </div>}
  <div className="mt-6"><p className="mb-2 text-sm font-medium">How would you like to pay?</p><PaymentMethodPicker value={props.paymentMethod} onChange={props.setPaymentMethod} /><p className="mt-2 text-xs text-muted-foreground">{props.wantsReturn ? "Applies to both your outbound and return trip." : ""}</p></div></div> }
export function PaymentMethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (value: PaymentMethod) => void }) {
  const options: { id: PaymentMethod; icon: typeof CreditCard; title: string; desc: string }[] = [
    { id: "card", icon: CreditCard, title: "Pay securely", desc: "Redirected to Stripe's secure checkout after you confirm." },
    { id: "cash", icon: Banknote, title: "Pay cash to driver", desc: "Settle the fare with your driver at the end of the trip." },
  ]
  return <div className="grid gap-3 sm:grid-cols-2">{options.map((option) => { const selected = option.id === value; return <button key={option.id} type="button" onClick={() => onChange(option.id)} className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left", selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card")}><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}><option.icon className="size-4" /></span><span><span className="block text-sm font-semibold">{option.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{option.desc}</span></span></button> })}</div>
}
function Summary({ pickup, dropoff, stops, stopsTotal, quote, vehicleFare, addOnsTotal, vehicle, pickupDate, pickupTime, promotion, promoInput, setPromoInput, appliedPromo, promoPending, onApplyPromo, onRemovePromo, wantsReturn, returnDate, returnTime, returnFare, returnDiscount }: { pickup: PlaceSelection | null; dropoff: PlaceSelection | null; stops: PlaceSelection[]; stopsTotal: number; quote: ReturnType<typeof computeFare> | null; vehicleFare: number | null; addOnsTotal: number; vehicle?: VehicleClass; pickupDate: string; pickupTime: string; promotion: SitePromotion; promoInput: string; setPromoInput: (value: string) => void; appliedPromo: AppliedPromo | null; promoPending: boolean; onApplyPromo: () => void; onRemovePromo: () => void; wantsReturn: boolean; returnDate: string; returnTime: string; returnFare: number | null; returnDiscount: ReturnTripDiscount }) {
  const subtotal = vehicleFare != null ? vehicleFare + addOnsTotal + stopsTotal : null
  const discountAmount = subtotal != null && appliedPromo ? computeDiscount(subtotal, appliedPromo) : 0
  const total = subtotal != null ? subtotal - discountAmount : null
  const combinedTotal = wantsReturn && total != null && returnFare != null ? total + returnFare : null
  return <aside className="h-fit space-y-4 lg:sticky lg:top-24">{pickup && dropoff && <TripMap originLat={pickup.lat} originLng={pickup.lng} originLabel={pickup.address} originTime={pickupTime || undefined} destLat={dropoff.lat} destLng={dropoff.lng} destLabel={dropoff.address} waypoints={stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))} /> }<div className="rounded-2xl border border-border/70 bg-card p-5"><h3 className="font-semibold">Trip summary</h3><div className="mt-4 space-y-3 text-sm"><Line label="Pickup" value={pickup?.address || "—"} />{stops.filter((s) => s.address).map((stop, i) => <Line key={i} label={`Stop ${i + 1}`} value={stop.address} />)}<Line label="Drop-off" value={dropoff?.address || "—"} /><Line label="When" value={pickupDate ? `${formatDate(pickupDate)} · ${pickupTime}` : "—"} /><Line label="Vehicle" value={vehicle?.name || "—"} />{quote && promotion.active && vehicleFare != null && vehicleFare !== quote.fare && <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">Fare</span><span className="text-right font-medium"><span className="mr-1.5 text-muted-foreground line-through">{formatCurrency(quote.fare)}</span><span className="text-primary">{formatCurrency(vehicleFare)}</span></span></div>}{stopsTotal > 0 && <Line label={`Stops (${stops.length} × ${formatCurrency(stopsTotal / stops.length)})`} value={formatCurrency(stopsTotal)} />}{addOnsTotal > 0 && <Line label="Add-ons" value={formatCurrency(addOnsTotal)} />}{appliedPromo && discountAmount > 0 && <Line label={`Promo (${appliedPromo.code})`} value={`-${formatCurrency(discountAmount)}`} />}</div>{quote && <div className="mt-4 border-t pt-4">{appliedPromo ? <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm font-medium">{appliedPromo.code}</span><Button size="sm" variant="ghost" onClick={onRemovePromo}>Remove</Button></div> : <div className="flex gap-2"><Input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Promo code" className="flex-1" /><Button size="sm" variant="outline" disabled={promoPending || !promoInput.trim()} onClick={onApplyPromo}>{promoPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}</Button></div>}</div>}<div className="mt-5 border-t pt-4"><div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">{wantsReturn ? "Outbound fare" : "Total fare"}</span><span className="text-2xl font-semibold">{total != null ? formatCurrency(total) : "—"}</span></div>{promotion.active && <p className="mt-1 text-right text-xs text-primary">Includes {promotion.discountPercent}% site-wide discount</p>}</div>{wantsReturn && <div className="mt-4 border-t pt-4"><div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">Return fare{returnDate && returnTime ? ` · ${formatDate(returnDate)} ${returnTime}` : ""}</span><span className="text-lg font-semibold">{returnFare != null ? formatCurrency(returnFare) : "—"}</span></div>{returnDiscount.active && <p className="mt-1 text-right text-xs text-primary">Includes {returnDiscount.discountPercent}% return-trip discount</p>}<div className="mt-3 flex items-end justify-between border-t pt-3"><span className="text-sm font-medium">Combined total</span><span className="text-xl font-semibold">{combinedTotal != null ? formatCurrency(combinedTotal) : "—"}</span></div><p className="mt-1 text-xs text-muted-foreground">Booked and paid as two separate trips.</p></div>}</div></aside>
}
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div> }
