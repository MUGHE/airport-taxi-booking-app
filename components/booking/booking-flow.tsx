"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Banknote, Briefcase, Calendar as CalendarIcon, Check, ChevronUp, CreditCard, Loader2, MapPin, MapPinPlus, Repeat, Sparkles, TicketPercent, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import { applyPromotion, computeDiscount, computeFare, formatCurrency } from "@/lib/fleet"
import { createBooking, createReturnBooking, getDistanceQuote, previewPromoCode } from "@/lib/actions"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { RouteCard } from "@/components/route-search"
import { TripMap } from "@/components/trip-map"
import type { BookingAddOn, PaymentMethod, PromoDiscountType, ReturnTripDiscount, SitePromotion, StopPricing, VehicleClass } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDate, localDate, minPickupTimeToday, TIME_SLOTS } from "@/lib/datetime"
import { toast } from "sonner"

const STEPS = ["Trip", "Vehicle", "Details", "Review"] as const
// The action bar panel's own open transition. The promo cue waits this out before it plays, so
// keep it in step with the open duration on that panel's className. (Closing there is deliberately
// quicker — getting a panel out of the way should feel immediate in a way that opening one does
// not — but nothing is sequenced behind the close, so only this one is needed here.)
const PANEL_OPEN_MS = 500
// The promo field's arrival pulse, plus a little slack so clearing the attribute never cuts the
// animation off mid-pulse. Keep in sync with the promo-spotlight keyframes in globals.css.
const SPOTLIGHT_MS = 1500
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

  // Continue/Back can be clicked from anywhere on a long step (the button sits at the bottom
  // of the form) — land the next step at its own top instead of wherever the scroll happened
  // to be, or it can open mid-way down a step the user hasn't seen yet.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

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
  // Mirrors Summary's own total/combinedTotal calc below — duplicated (not lifted) so the mobile
  // action bar can show the same figure without changing Summary's props.
  const mobileSubtotal = vehicleFare != null ? vehicleFare + addOnsTotal + stopsTotal : null
  const mobileDiscount = mobileSubtotal != null && appliedPromo ? computeDiscount(mobileSubtotal, appliedPromo) : 0
  const mobileTotal = mobileSubtotal != null ? mobileSubtotal - mobileDiscount : null
  const mobileCombinedTotal = wantsReturn && mobileTotal != null && returnFareEstimate != null ? mobileTotal + returnFareEstimate : null
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

  // Built once and reused in both places it can appear — the desktop sidebar and the mobile
  // action bar's expandable panel — so there is exactly one place that lists Summary's props.
  const summaryPanel = (showMap: boolean) => <Summary showMap={showMap} pickup={pickup} dropoff={dropoff} stops={stops} stopsTotal={stopsTotal} quote={quote} vehicleFare={vehicleFare} addOnsTotal={addOnsTotal} vehicle={vehicle} pickupDate={pickupDate} pickupTime={pickupTime} promotion={promotion} promoInput={promoInput} setPromoInput={setPromoInput} appliedPromo={appliedPromo} promoPending={promoPending} onApplyPromo={applyPromo} onRemovePromo={removePromo} wantsReturn={wantsReturn} returnDate={returnDate} returnTime={returnTime} returnFare={returnFareEstimate} returnDiscount={returnDiscount} paymentMethod={paymentMethod} />

  return <><div className="grid gap-8 pb-24 lg:grid-cols-[1fr_340px] lg:pb-0"><div className="min-w-0">{promotion.active && <PromotionBanner percent={promotion.discountPercent} />}<MobileStepHeader step={step} onBack={() => setStep((value) => Math.max(value - 1, 0))} /><div className="hidden sm:block"><Stepper step={step} /></div><div className="mt-8">
    {step === 0 && <TripStep pickup={pickup} setPickup={setPickup} dropoff={dropoff} setDropoff={setDropoff} pickupDate={pickupDate} setPickupDate={setPickupDate} pickupTime={pickupTime} setPickupTime={setPickupTime} today={today} stops={stops} setStops={setStops} stopPricing={stopPricing} />}
    {step === 1 && <VehicleStep vehicleId={vehicleId} setVehicleId={setVehicleId} distanceMiles={distanceMiles} durationMinutes={durationMinutes} vehicles={vehicles} loading={distanceLoading} promotion={promotion} />}
    {step === 2 && <DetailsStep {...{ customerName, setCustomerName, email, setEmail, phone, setPhone, passengers, setPassengers, bags, setBags, notes, setNotes, flightNumber, setFlightNumber, addOns, selectedAddOnIds, setSelectedAddOnIds, pickup, dropoff, pickupDate, pickupTime, today, wantsReturn, setWantsReturn, returnDate, setReturnDate, returnTime, setReturnTime, returnDiscount, returnAddressSame, setReturnAddressSame, returnPickup, setReturnPickup, returnDropoff, setReturnDropoff, vehicleFare, returnFare: returnFareEstimate }} maxCapacity={vehicle?.capacity ?? 6} maxLuggage={vehicle?.luggage ?? 0} />}
    {step === 3 && <ReviewStep pickup={pickup?.address || ""} dropoff={dropoff?.address || ""} stops={stops} stopsTotal={stopsTotal} vehicle={vehicle?.name || ""} pickupDate={pickupDate} pickupTime={pickupTime} flightNumber={flightNumber} passengers={passengers} bags={bags} customerName={customerName} email={email} phone={phone} notes={notes} addOns={addOns.filter((addOn) => selectedAddOnIds.includes(addOn.id))} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} wantsReturn={wantsReturn} returnDate={returnDate} returnTime={returnTime} returnFare={returnFareEstimate} returnDiscount={returnDiscount} returnPickupAddress={effectiveReturnPickup?.address || ""} returnDropoffAddress={effectiveReturnDropoff?.address || ""} />}
  </div><div className="mt-8 hidden justify-between gap-3 sm:flex"><Button variant="ghost" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0 || isPending}><ArrowLeft className="size-4" />Back</Button>{step < 3 ? <Button onClick={next}>Continue<ArrowRight className="size-4" /></Button> : <Button onClick={submit} disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Confirm booking</Button>}</div></div>
    <div className="hidden sm:block">{summaryPanel(true)}</div></div>
    {/* No map in the bottom sheet: it costs ~200px of a panel whose whole job is the fare
        breakdown and the offer field, and the route is already shown on the Trip step. */}
    <MobileActionBar step={step} total={mobileTotal} combinedTotal={mobileCombinedTotal} wantsReturn={wantsReturn} isPending={isPending} onNext={next} onSubmit={submit} summary={summaryPanel(false)} canApplyPromo={quote != null} appliedPromo={appliedPromo} onRemovePromo={removePromo} />
  </>
}
function PromotionBanner({ percent }: { percent: number }) { return <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"><Sparkles className="size-4 shrink-0" />Limited-time offer: {percent}% off every fare — the discount is already applied below.</div> }

function Stepper({ step }: { step: number }) { return <ol className="flex items-center gap-2">{STEPS.map((label, index) => <li key={label} className="flex flex-1 items-center gap-2"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium", index < step && "border-primary bg-primary text-primary-foreground", index === step && "border-primary text-primary")}>{index < step ? <Check className="size-4" /> : index + 1}</span><span className="hidden text-sm font-medium sm:block">{label}</span>{index < 3 && <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />}</li>)}</ol> }

// Mobile-only step header: back arrow (step 0 keeps its place with an invisible spacer, so the
// title never jumps sideways) + step name + count, and a 4-segment progress bar underneath.
// Replaces the desktop <Stepper> below sm, where its labels and connecting line are hidden and it
// reads as four unlabeled circles.
function MobileStepHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return <div className="sm:hidden">
    <div className="mb-2.5 flex items-center gap-2">
      {step > 0
        ? <button type="button" onClick={onBack} aria-label="Back" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground"><ArrowLeft className="size-4" /></button>
        : <span className="size-8 shrink-0" aria-hidden="true" />}
      <span className="flex-1 text-[15px] font-semibold">{STEPS[step]}</span>
      <span className="text-xs font-medium text-muted-foreground">{step + 1} of {STEPS.length}</span>
    </div>
    <div className="flex h-1 gap-1">
      {STEPS.map((label, index) => <span key={label} className={cn("h-full flex-1 rounded-full", index <= step ? "bg-primary" : "bg-border")} />)}
    </div>
  </div>
}

// Mobile-only action bar: fixed to the viewport bottom so Continue/Confirm booking is always in
// reach, regardless of how long the current step's content scrolls — no change to any step's own
// content. Shows the running total once a vehicle (and so a fare) exists; step 0 has none yet.
// z-index sits above the site-wide help bubble (help-button.tsx, z-50) so that floating button can
// never sit on top of the primary action.
function MobileActionBar({ step, total, combinedTotal, wantsReturn, isPending, onNext, onSubmit, summary, canApplyPromo, appliedPromo, onRemovePromo }: { step: number; total: number | null; combinedTotal: number | null; wantsReturn: boolean; isPending: boolean; onNext: () => void; onSubmit: () => void; summary: React.ReactNode; canApplyPromo: boolean; appliedPromo: AppliedPromo | null; onRemovePromo: () => void }) {
  const barRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // Drives the arrival animation on the promo field (see openPromo and globals.css).
  const [spotlight, setSpotlight] = useState(false)
  const spotlightTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(spotlightTimer.current), [])

  const contentRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)
  // Tracked in a ref, not state — a drag reads/writes this on every pointermove and a re-render
  // per pixel of finger movement isn't needed for anything (the gesture is only resolved once, on
  // release), just wasted work.
  const dragRef = useRef<{ startY: number; moved: boolean } | null>(null)

  // Publishes the real gap between this card's top edge and the bottom of the viewport (not just
  // the card's own height — it floats with a gap below it too) as a CSS variable on <body>, so the
  // site-wide help bubble — a sibling of this page's content up in the root layout, unreachable by
  // props — can lift itself clear of it instead of sitting underneath. Measured rather than
  // hard-coded so it stays correct as the card grows, shrinks, or its floating inset ever changes.
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const publish = () => document.body.style.setProperty("--mobile-action-bar-h", `${window.innerHeight - el.getBoundingClientRect().top}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    window.addEventListener("resize", publish)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", publish)
      document.body.style.removeProperty("--mobile-action-bar-h")
    }
  }, [])

  // A summary from a step ago shouldn't stay pinned open once the user has moved on.
  useEffect(() => setOpen(false), [step])

  const showReview = step === 3
  const price = showReview && wantsReturn ? combinedTotal : total
  const priceLabel = showReview && wantsReturn ? "Combined total" : wantsReturn ? "Outbound fare" : "Total"
  // Nothing worth expanding for until a vehicle (and so a fare) is chosen on Trip.
  const canExpand = price != null

  // The panel animates to the height its content actually needs, capped at 65vh — not to a flat
  // 65vh. Animating to a cap the content never reaches means the panel stops growing partway
  // through the transition (once max-height passes the content height) and the rest of the
  // duration animates past content that isn't there: a 500ms open that visibly finishes in ~150ms,
  // by a margin that shifts with how long the summary happens to be. Measured continuously rather
  // than on open, so the number is already right at the moment it's needed, and so the panel
  // follows its own content if that grows while open.
  //
  // Keyed on canExpand because the content only mounts once a fare exists: on a mount-only effect
  // the ref is still null here and the measurement never happens at all.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => setPanelHeight(Math.min(el.scrollHeight, window.innerHeight * 0.65))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [canExpand])

  // Drag the handle up to open, down to close — a plain tap (no meaningful movement) toggles too,
  // so the gesture stays discoverable for anyone who doesn't try dragging it first. Resolved once
  // on release rather than followed live: a direction + distance past a small threshold is enough
  // to decide open/closed without tracking (and mounting the panel to measure) every pixel in between.
  const DRAG_THRESHOLD = 24
  function handleHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Deliberately no setPointerCapture: capturing would retarget pointerup to this row, and the
    // click event — dispatched to the common ancestor of down/up — would then land here instead of
    // on the chip the finger is actually on, silently killing both buttons.
    dragRef.current = { startY: e.clientY, moved: false }
  }
  function handleHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    if (Math.abs(e.clientY - drag.startY) > 6) drag.moved = true
  }
  function handleHandlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    dragRef.current = null
    // A tap is left to whichever chip was tapped — this row no longer toggles on tap, or every
    // chip press would fire its own action and the toggle.
    if (!drag || !drag.moved) return
    const draggedUp = drag.startY - e.clientY
    if (draggedUp > DRAG_THRESHOLD) setOpen(true)
    else if (draggedUp < -DRAG_THRESHOLD) setOpen(false)
  }

  // Opens the panel and points at the promo field without taking it over: no focus(), so no
  // keyboard thrown up over the summary the customer just asked to see, and no caret landing
  // somewhere they didn't put it. The animation does the pointing; tapping the field stays theirs.
  //
  // The field is found by query rather than a ref because <Summary> is rendered twice (desktop
  // sidebar and this panel); a single ref passed to both would end up pointing at whichever
  // mounted last, which on a phone is the display:none desktop copy. Scoping the query to this
  // bar's own subtree always finds ours.
  function openPromo() {
    // Clearing the flag first is what lets a repeat tap replay the animation: the attribute has to
    // actually leave the DOM before it can be re-added, or the browser sees the same still-running
    // animation and nothing restarts.
    setOpen(true)
    setSpotlight(false)
    window.clearTimeout(spotlightTimer.current)
    // Sequenced behind the panel's own open rather than fired alongside it: scrolling a container
    // that is still growing lands in the wrong place, and a pulse on a field still sliding into
    // view reads as jitter rather than as a cue. "nearest" leaves an already-visible field where
    // it is instead of scrolling for the sake of it.
    spotlightTimer.current = window.setTimeout(() => {
      barRef.current?.querySelector<HTMLInputElement>("[data-promo-input]")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      setSpotlight(true)
      // Ends on its own rather than looping — a pulse still going while someone is typing their
      // code stops being a cue and becomes a distraction.
      spotlightTimer.current = window.setTimeout(() => setSpotlight(false), SPOTLIGHT_MS)
    }, PANEL_OPEN_MS)
  }

  // A floating card (inset from the screen edges, fully rounded, its own shadow) — not full-bleed
  // chrome — with the handle as its topmost element. The row is the last flex child and never
  // moves; the handle is the first and always sits at the card's top edge, so as the panel between
  // them grows the card's top edge (and the handle riding on it) rises while the row stays put —
  // like pulling a car boot's parcel-shelf divider up by its strap.
  return <div
    ref={barRef}
    className="fixed inset-x-3 z-[60] overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:hidden"
    style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
  >
    {/* Both of the things customers were missing behind the old bare drag handle — the offer entry
        and the fare breakdown — now sit here as named, always-visible controls. The row still
        drags open/closed for anyone who reaches for that gesture, but nothing depends on
        discovering it. */}
    {canExpand && (
      <div
        onPointerDown={handleHandlePointerDown}
        onPointerMove={handleHandlePointerMove}
        onPointerUp={handleHandlePointerUp}
        onPointerCancel={() => { dragRef.current = null }}
        className="flex touch-none items-center justify-between gap-2 px-3 pb-2 pt-2.5"
      >
        <div className="min-w-0">
          {appliedPromo
            ? <span className="flex min-w-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 py-1 pl-2.5 pr-1 text-xs font-medium text-primary">
                <TicketPercent className="size-3.5 shrink-0" />
                <span className="truncate font-mono">{appliedPromo.code}</span>
                <button type="button" onClick={onRemovePromo} aria-label={`Remove promo code ${appliedPromo.code}`} className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-primary/15">
                  <X className="size-3.5" />
                </button>
              </span>
            : canApplyPromo && <button type="button" onClick={openPromo} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium transition-transform duration-150 hover:bg-secondary/70 active:scale-95">
                <TicketPercent className="size-3.5 shrink-0" />
                Apply offer
              </button>}
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {open ? "Hide" : "Trip summary"}
          {/* Matched to the panel so the chevron turns with it rather than finishing first. */}
          <ChevronUp className={cn("size-3.5 transition-transform [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]", open ? "rotate-180 duration-500" : "duration-300")} />
        </button>
      </div>
    )}
    {/* Height-animated, not mount/unmount-animated: this is what makes the handle read as rising
        with the card's own top edge, rather than the panel popping in at full size behind a
        handle that never moved. Kept mounted (once a fare exists) so the max-height transition has
        something to measure and animate.
        inert while collapsed: max-height:0 only clips the panel visually, so without it the promo
        field stays tabbable and is still announced by screen readers from behind a closed panel. */}
    {canExpand && (
      <div
        inert={!open}
        data-promo-spotlight={spotlight ? "" : undefined}
        // An even curve, not an aggressive ease-out. Sharp ease-outs (easeOutQuint and friends)
        // put most of the travel into the first fifth of the duration, so the panel reads as
        // snapping open in a fraction of its actual time and then crawling — raising the duration
        // alone only lengthens the crawl. This one spreads the movement across the whole
        // transition, so half a second actually feels like half a second.
        className={cn(
          "overflow-y-auto transition-[max-height] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
          open ? "duration-500" : "duration-300",
        )}
        // Falls back to the cap for the first render, before the content has been measured.
        style={{ maxHeight: open ? (panelHeight ? `${panelHeight}px` : "65vh") : "0px" }}
      >
        <div ref={contentRef} className="border-t border-border p-4">{summary}</div>
      </div>
    )}
    <div className={cn("flex items-center justify-between gap-3 px-4 py-3", canExpand && "border-t border-border")}>
      {price != null
        ? <span className="min-w-0"><span className="block text-[11px] font-medium text-muted-foreground">{priceLabel}</span><span className="text-lg font-semibold">{formatCurrency(price)}</span></span>
        : <span className="text-xs text-muted-foreground">Price shown once<br />a vehicle's picked</span>}
      {showReview
        ? <Button onClick={onSubmit} disabled={isPending} className="shrink-0">{isPending && <Loader2 className="size-4 animate-spin" />}Confirm booking</Button>
        : <Button onClick={onNext} className="shrink-0">Continue<ArrowRight className="size-4" /></Button>}
    </div>
  </div>
}
function Heading({ title, desc }: { title: string; desc: string }) { return <div className="mb-5"><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div> }
function TripStep({ pickup, setPickup, dropoff, setDropoff, pickupDate, setPickupDate, pickupTime, setPickupTime, today, stops, setStops, stopPricing }: { pickup: PlaceSelection | null; setPickup: (value: PlaceSelection | null) => void; dropoff: PlaceSelection | null; setDropoff: (value: PlaceSelection | null) => void; pickupDate: string; setPickupDate: (value: string) => void; pickupTime: string; setPickupTime: (value: string) => void; today: string; stops: PlaceSelection[]; setStops: (value: PlaceSelection[]) => void; stopPricing: StopPricing }) {
  const [dateOpen, setDateOpen] = useState(false)
  const isToday = pickupDate === today
  // For a same-day pickup, the earliest selectable slot is "now" rounded up to the
  // 15-minute grid — not an arbitrary slot further out.
  const minTimeToday = minPickupTimeToday()
  const availableTimes = isToday ? TIME_SLOTS.filter((t) => t >= minTimeToday) : TIME_SLOTS
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
  return <div><Heading title="Plan your trip" desc="Set where we collect you and where you are heading." /><div className="sm:hidden"><RouteCard pickup={pickup} dropoff={dropoff} stops={stops} maxStops={MAX_STOPS} pricePerStop={stopPricing.pricePerStop} onPickupChange={setPickup} onDropoffChange={setDropoff} onStopsChange={setStops} /></div><div className="mt-4 grid gap-4 sm:mt-0 sm:grid-cols-2"><div className="hidden sm:contents"><Field label="Pickup location"><DestinationPicker defaultValue={pickup?.address} placeholder="Start typing a pickup address" onSelect={setPickup} onClear={() => setPickup(null)} /></Field><Field label="Drop-off location"><DestinationPicker defaultValue={dropoff?.address} placeholder="Start typing a drop-off address" onSelect={setDropoff} onClear={() => setDropoff(null)} /></Field></div><div className="grid grid-cols-2 gap-4 sm:contents"><Field label="Pickup date">
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
    <TimePicker value={pickupTime} onChange={handleTimeChange} times={availableTimes} />
  </Field></div></div>
  <div className="mt-6 hidden sm:block">
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
function VehicleStep({ vehicleId, setVehicleId, distanceMiles, durationMinutes, vehicles, loading, promotion }: { vehicleId: string; setVehicleId: (value: string) => void; distanceMiles: number | null; durationMinutes: number | null; vehicles: VehicleClass[]; loading: boolean; promotion: SitePromotion }) {
  // One priced row per vehicle, so the whole fleet and its prices sit in a single scannable
  // column on a phone; the roomier picture cards stay for wider screens.
  const priceOf = (item: VehicleClass) => {
    const quote = distanceMiles != null && durationMinutes != null ? computeFare(item, distanceMiles, durationMinutes) : null
    const original = quote ? quote.fare : item.minFare
    return { quoted: quote !== null, original, price: promotion.active ? applyPromotion(original, promotion.discountPercent) : original }
  }

  return <div>
    <Heading title="Pick your vehicle" desc={loading ? "Calculating your route…" : "Fares are fixed and include all taxes, tolls, and gratuity."} />

    {/* Phones: comparison list. */}
    <div className="flex flex-col gap-2.5 sm:hidden">
      {vehicles.map((item, index) => {
        const { quoted, original, price } = priceOf(item)
        const selected = item.id === vehicleId
        return <button key={item.id} type="button" onClick={() => setVehicleId(item.id)}
          aria-pressed={selected}
          className={cn("animate-card-in flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left", selected ? "border-primary" : "border-border")}
          style={{ borderWidth: selected ? "1.5px" : "1px", boxShadow: selected ? "0 0 0 3px oklch(0.48 0.16 256 / 0.12)" : undefined, animationDelay: `${index * 60}ms` }}>
          <span className="relative flex size-[58px] w-21 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
            <Image src={item.image || "/placeholder.svg"} alt={item.name} width={76} height={52} className="h-[52px] w-[76px] object-contain" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold tracking-[-0.005em]">{item.name}</span>
            <span className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="size-3.5" />{item.capacity}</span>
              <span className="flex items-center gap-1"><Briefcase className="size-3.5" />{item.luggage}</span>
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {promotion.active && <span className="text-xs text-muted-foreground line-through">{formatCurrency(original)}</span>}
            <span className={cn("text-[17px] font-semibold tracking-[-0.01em]", promotion.active && "text-primary")}>{quoted ? formatCurrency(price) : `from ${formatCurrency(price)}`}</span>
            {selected && <span className="flex size-5 items-center justify-center rounded-full bg-primary"><Check className="size-3 text-primary-foreground" strokeWidth={3.5} /></span>}
          </span>
        </button>
      })}
    </div>

    {/* Wider screens keep the picture cards. */}
    <div className="hidden gap-4 sm:grid sm:grid-cols-2">
      {vehicles.map((item, index) => {
        const { quoted, original, price } = priceOf(item)
        const selected = item.id === vehicleId
        // Unselected cards stay the same white card + secondary image panel as the selected one —
        // selection is a soft primary halo + corner check mark, not a competing flat-color fill.
        return <button key={item.id} type="button" onClick={() => setVehicleId(item.id)}
          aria-pressed={selected}
          className={cn("animate-card-in overflow-hidden rounded-2xl border bg-card text-left", selected ? "border-primary" : "border-border")}
          style={{ borderWidth: selected ? "1.5px" : "1px", boxShadow: selected ? "0 0 0 3px oklch(0.48 0.16 256 / 0.12), 0 6px 16px oklch(0.48 0.16 256 / 0.14)" : "0 1px 2px oklch(0.21 0.03 256 / 0.04)", animationDelay: `${index * 150}ms` }}>
          <div className="relative aspect-[4/3] bg-secondary">
            <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-contain p-1.5" sizes="(max-width: 640px) 100vw, 320px" />
            {selected && <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-primary shadow-sm"><Check className="size-3.5 text-primary-foreground" strokeWidth={3} /></span>}
          </div>
          <div className="p-4"><h3 className="font-semibold">{item.name}</h3><div className="mt-1 flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="size-3.5" />{item.capacity}</span><span className="flex items-center gap-1"><Briefcase className="size-3.5" />{item.luggage}</span></div><div className="my-3 border-t border-border" /><div className="flex items-baseline gap-1.5">{promotion.active && <span className="text-sm text-muted-foreground line-through">{formatCurrency(original)}</span>}<span className={cn("font-semibold", promotion.active && "text-primary")}>{quoted ? formatCurrency(price) : `from ${formatCurrency(price)}`}</span></div>{promotion.active && <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{promotion.discountPercent}% off</span>}</div>
        </button>
      })}
    </div>
  </div>
}
function DetailsStep(props: any) { return <div><Heading title="Passenger details" desc="We'll send your confirmation and driver details to your email." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={props.customerName} onChange={(e) => props.setCustomerName(e.target.value)} /></Field><Field label="Email"><Input type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} /></Field><Field label="Phone"><Input type="tel" value={props.phone} onChange={(e) => props.setPhone(e.target.value)} /></Field><Field label="Flight number (optional)"><Input value={props.flightNumber} onChange={(e) => props.setFlightNumber(e.target.value.toUpperCase())} /></Field><div className="grid grid-cols-2 gap-4 sm:contents"><Field label="Passengers"><Select value={String(props.passengers)} onValueChange={(value) => props.setPassengers(Number(value))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: props.maxCapacity }, (_, index) => index + 1).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></Field><Field label="Bags"><Select value={String(Math.min(props.bags, props.maxLuggage))} onValueChange={(value) => props.setBags(Number(value))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: props.maxLuggage + 1 }, (_, index) => index).map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></Field></div><div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Trip add-ons</p><div className="grid gap-2 sm:grid-cols-2">{props.addOns.map((addOn: BookingAddOn) => {
              const checked = props.selectedAddOnIds.includes(addOn.id)
              // Same selectable-card language as the payment method picker below (border-primary +
              // ring + tint when picked) instead of a bare, unstyled native checkbox.
              return <label key={addOn.id} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-sm", checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card")}>
                <span className="flex items-center gap-3">
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => props.setSelectedAddOnIds(checked ? props.selectedAddOnIds.filter((id: string) => id !== addOn.id) : [...props.selectedAddOnIds, addOn.id])} />
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-[4px] border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}><Check className="size-3.5" strokeWidth={3} /></span>
                  <span className="font-medium">{addOn.name}</span>
                </span>
                <span className={cn("font-medium", checked && "text-primary")}>{addOn.price === 0 ? "Free" : formatCurrency(addOn.price)}</span>
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
      <span className={cn("mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border", wantsReturn ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-transparent")}><Check className="size-3.5" strokeWidth={3} /></span>
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
      <div className="mt-4 grid grid-cols-2 gap-4">
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
          <TimePicker value={returnTime} onChange={handleReturnTimeChange} times={returnAvailableTimes} />
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
function ReviewStep(props: any) { return <div><Heading title="Review your trip" desc="Double-check the details below, then confirm your booking." /><div className="divide-y rounded-2xl border bg-card">{[["Route", `${props.pickup} → ${props.dropoff}`], ...(props.stops.length ? [["Stops", `${props.stops.map((s: PlaceSelection, i: number) => `${i + 1}. ${s.address}`).join(", ")}${props.stopsTotal > 0 ? ` (+${formatCurrency(props.stopsTotal)})` : ""}`]] : []), ["Vehicle", props.vehicle], ["Pickup", `${formatDate(props.pickupDate)} at ${props.pickupTime}`], ["Party", `${props.passengers} passenger${props.passengers === 1 ? "" : "s"}, ${props.bags} bag${props.bags === 1 ? "" : "s"}`], ["Add-ons", props.addOns.length ? props.addOns.map((addOn: BookingAddOn) => `${addOn.name} (${addOn.price === 0 ? "Free" : formatCurrency(addOn.price)})`).join(", ") : "None"], ["Passenger", props.customerName], ["Contact", `${props.email} · ${props.phone}`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 px-5 py-3.5 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>)}</div>
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
function Summary({ showMap, pickup, dropoff, stops, stopsTotal, quote, vehicleFare, addOnsTotal, vehicle, pickupDate, pickupTime, promotion, promoInput, setPromoInput, appliedPromo, promoPending, onApplyPromo, onRemovePromo, wantsReturn, returnDate, returnTime, returnFare, returnDiscount, paymentMethod }: { showMap: boolean; pickup: PlaceSelection | null; dropoff: PlaceSelection | null; stops: PlaceSelection[]; stopsTotal: number; quote: ReturnType<typeof computeFare> | null; vehicleFare: number | null; addOnsTotal: number; vehicle?: VehicleClass; pickupDate: string; pickupTime: string; promotion: SitePromotion; promoInput: string; setPromoInput: (value: string) => void; appliedPromo: AppliedPromo | null; promoPending: boolean; onApplyPromo: () => void; onRemovePromo: () => void; wantsReturn: boolean; returnDate: string; returnTime: string; returnFare: number | null; returnDiscount: ReturnTripDiscount; paymentMethod: PaymentMethod }) {
  const subtotal = vehicleFare != null ? vehicleFare + addOnsTotal + stopsTotal : null
  const discountAmount = subtotal != null && appliedPromo ? computeDiscount(subtotal, appliedPromo) : 0
  const total = subtotal != null ? subtotal - discountAmount : null
  const combinedTotal = wantsReturn && total != null && returnFare != null ? total + returnFare : null
  return <aside className="h-fit min-w-0 space-y-4 lg:sticky lg:top-24">{showMap && pickup && dropoff && <TripMap originLat={pickup.lat} originLng={pickup.lng} originLabel={pickup.address} originTime={pickupTime || undefined} destLat={dropoff.lat} destLng={dropoff.lng} destLabel={dropoff.address} waypoints={stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))} /> }<div className="rounded-2xl border border-border/70 bg-card p-5"><h3 className="font-semibold">Trip summary</h3><div className="mt-4 space-y-3 text-sm"><Line label="Pickup" value={pickup?.address || "—"} />{stops.filter((s) => s.address).map((stop, i) => <Line key={i} label={`Stop ${i + 1}`} value={stop.address} />)}<Line label="Drop-off" value={dropoff?.address || "—"} /><Line label="When" value={pickupDate ? `${formatDate(pickupDate)} · ${pickupTime}` : "—"} /><Line label="Vehicle" value={vehicle?.name || "—"} />{quote && promotion.active && vehicleFare != null && vehicleFare !== quote.fare && <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">Fare</span><span className="text-right font-medium"><span className="mr-1.5 text-muted-foreground line-through">{formatCurrency(quote.fare)}</span><span className="text-primary">{formatCurrency(vehicleFare)}</span></span></div>}{stopsTotal > 0 && <Line label={`Stops (${stops.length} × ${formatCurrency(stopsTotal / stops.length)})`} value={formatCurrency(stopsTotal)} />}{addOnsTotal > 0 && <Line label="Add-ons" value={formatCurrency(addOnsTotal)} />}{appliedPromo && discountAmount > 0 && <Line label={`Promo (${appliedPromo.code})`} value={`-${formatCurrency(discountAmount)}`} />}</div>{quote && <div className="mt-4 border-t pt-4">{appliedPromo ? <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm font-medium">{appliedPromo.code}</span><Button size="sm" variant="ghost" onClick={onRemovePromo}>Remove</Button></div> : <div className="flex gap-2"><Input data-promo-input="" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Promo code" className="flex-1" /><Button size="sm" variant="outline" disabled={promoPending || !promoInput.trim()} onClick={onApplyPromo}>{promoPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}</Button></div>}</div>}<div className="mt-5 border-t pt-4"><div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">{wantsReturn ? "Outbound fare" : "Total fare"}</span><span className="text-2xl font-semibold">{total != null ? formatCurrency(total) : "—"}</span></div>{promotion.active && <p className="mt-1 text-right text-xs text-primary">Includes {promotion.discountPercent}% site-wide discount</p>}</div>{wantsReturn && <div className="mt-4 border-t pt-4"><div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">Return fare{returnDate && returnTime ? ` · ${formatDate(returnDate)} ${returnTime}` : ""}</span><span className="text-lg font-semibold">{returnFare != null ? formatCurrency(returnFare) : "—"}</span></div>{returnDiscount.active && <p className="mt-1 text-right text-xs text-primary">Includes {returnDiscount.discountPercent}% return-trip discount</p>}<div className="mt-3 flex items-end justify-between border-t pt-3"><span className="text-sm font-medium">Combined total</span><span className="text-xl font-semibold">{combinedTotal != null ? formatCurrency(combinedTotal) : "—"}</span></div><p className="mt-1 text-xs text-muted-foreground">{paymentMethod === "cash" ? "Booked as two separate trips, each paid in cash to your driver." : "Booked as two separate trips, charged together in one secure payment."}</p></div>}</div></aside>
}
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div> }
