import Link from "next/link"
import {
  CalendarClock,
  CarFront,
  CircleDollarSign,
  Mail,
  MapPin,
  Phone,
  Plane,
  Repeat,
  StickyNote,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAirport, getVehicle, formatCurrency } from "@/lib/fleet"
import type { Booking } from "@/lib/types"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status"

export function BookingDetails({ booking }: { booking: Booking }) {
  const airport = getAirport(booking.airportId)
  const vehicle = getVehicle(booking.vehicleId)
  const from = booking.pickupAddress ?? (booking.direction === "from-airport" ? airport?.name : booking.destinationAddress)
  const to = booking.dropoffAddress ?? (booking.direction === "from-airport" ? booking.destinationAddress : airport?.name)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Booking reference</p>
          <p className="font-mono text-lg font-semibold tracking-wider">
            {booking.reference}
          </p>
        </div>
        <Badge variant="outline" className={STATUS_STYLES[booking.status]}>
          {STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <dl className="divide-y divide-border">
        <Item icon={<CircleDollarSign className="size-4" />} label="Payment">
          {booking.paymentStatus === "paid"
            ? "Paid"
            : booking.paymentMethod === "cash"
              ? "Cash to driver"
              : "Awaiting payment"}
        </Item>
        <Item icon={<MapPin className="size-4" />} label="Route">
          {from} <span className="text-muted-foreground">→</span> {to}
        </Item>
        {booking.stops.length > 0 && (
          <Item icon={<MapPin className="size-4" />} label="Stops">
            {booking.stops.map((stop) => stop.address).join(", ")} ({formatCurrency(booking.stopsTotal)})
          </Item>
        )}
        <Item icon={<CalendarClock className="size-4" />} label="Pickup">
          {formatDate(booking.pickupDate)} at {booking.pickupTime}
        </Item>
        <Item icon={<CarFront className="size-4" />} label="Vehicle">
          {vehicle?.name}
        </Item>
        {booking.addOns.length > 0 && (
          <Item icon={<CircleDollarSign className="size-4" />} label="Add-ons">
            {booking.addOns.map((addOn) => addOn.name).join(", ")} ({formatCurrency(booking.addOnsTotal)})
          </Item>
        )}
        {booking.promoCode && booking.discountAmount > 0 && (
          <Item icon={<CircleDollarSign className="size-4" />} label="Promo code">
            {booking.promoCode} (-{formatCurrency(booking.discountAmount)})
          </Item>
        )}
        {booking.flightNumber && (
          <Item icon={<Plane className="size-4" />} label="Flight">
            {booking.flightNumber}
          </Item>
        )}
        <Item icon={<Users className="size-4" />} label="Party">
          {booking.passengers} passenger(s), {booking.bags} bag(s)
        </Item>
        <Item icon={<Users className="size-4" />} label="Customer">
          {booking.customerName}
        </Item>
        <Item icon={<Mail className="size-4" />} label="Email">
          {booking.email}
        </Item>
        <Item icon={<Phone className="size-4" />} label="Phone">
          {booking.phone}
        </Item>
        {booking.notes && (
          <Item icon={<StickyNote className="size-4" />} label="Notes">
            {booking.notes}
          </Item>
        )}
        {(booking.returnTripReference || booking.outboundTripReference) && (
          <Item icon={<Repeat className="size-4" />} label={booking.returnTripReference ? "Return trip" : "Outbound trip"}>
            <Link
              href={`/booking/${booking.returnTripReference || booking.outboundTripReference}`}
              className="font-mono text-primary hover:underline"
            >
              {booking.returnTripReference || booking.outboundTripReference}
            </Link>
          </Item>
        )}
      </dl>

      <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-5 py-4">
        <span className="text-sm font-medium text-muted-foreground">Total fare</span>
        <span className="text-xl font-semibold tabular-nums">
          {formatCurrency(booking.fare)}
        </span>
      </div>
    </div>
  )
}

function Item({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium sm:text-right">{children}</dd>
    </div>
  )
}

function formatDate(value: string): string {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
