"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Banknote, CalendarClock, Car, CircleDollarSign, CreditCard, Eye, Pencil, Receipt, Search, TicketCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingDetails } from "@/components/booking-details"
import { EditBookingDialog } from "@/components/admin/edit-booking-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAirport, getVehicle, formatCurrency } from "@/lib/fleet"
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES } from "@/lib/status"
import { sendInvoiceAction, updateBookingStatus } from "@/lib/actions"
import type { Booking, BookingAddOn, BookingStatus, VehicleClass } from "@/lib/types"
import { toast } from "sonner"

type Filter = "all" | BookingStatus
const PAGE_SIZE = 20

export function AdminDashboard({
  bookings,
  vehicles,
  addOns,
}: {
  bookings: Booking[]
  vehicles: VehicleClass[]
  addOns: Array<BookingAddOn & { active: boolean }>
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSendingInvoice, startInvoiceTransition] = useTransition()
  const [sendingInvoiceRef, setSendingInvoiceRef] = useState<string | null>(null)

  const stats = useMemo(() => {
    const active = bookings.filter(
      (b) => b.status !== "completed" && b.status !== "cancelled",
    ).length
    const today = new Date().toISOString().slice(0, 10)
    const todays = bookings.filter((b) => b.pickupDate === today).length
    const revenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.fare, 0)
    return { total: bookings.length, active, todays, revenue }
  }, [bookings])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false
      if (!q) return true
      return (
        b.reference.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.flightNumber.toLowerCase().includes(q)
      )
    })
  }, [bookings, filter, query])

  // Changing the filter or search should always land back on page 1 — otherwise a narrower
  // result set can leave the admin stranded on a page that no longer has anything on it.
  useEffect(() => { setPage(1) }, [filter, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  useEffect(() => { setPage((p) => Math.min(p, pageCount)) }, [pageCount])
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  function changeStatus(reference: string, status: BookingStatus) {
    startTransition(async () => {
      const updated = await updateBookingStatus(reference, status)
      if (updated) {
        toast.success(`${reference} marked as ${STATUS_LABELS[status]}`)
        router.refresh()
      } else {
        toast.error("Could not update booking.")
      }
    })
  }

  function sendInvoice(reference: string) {
    setSendingInvoiceRef(reference)
    startInvoiceTransition(async () => {
      const result = await sendInvoiceAction(reference)
      if (result.ok) {
        toast.success(`Invoice sent to customer for ${reference}`)
      } else {
        toast.error(result.error || "Could not send invoice.")
      }
      setSendingInvoiceRef(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<TicketCheck className="size-5" />} label="Total bookings" value={String(stats.total)} />
        <StatCard icon={<Car className="size-5" />} label="Active trips" value={String(stats.active)} />
        <StatCard icon={<CalendarClock className="size-5" />} label="Pickups today" value={String(stats.todays)} />
        <StatCard
          icon={<CircleDollarSign className="size-5" />}
          label="Booked revenue"
          value={formatCurrency(stats.revenue)}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 7 filters don't fit one row at typical widths, and the pill's fixed height breaks
            when it wraps — scroll horizontally instead, same pattern as the fleet carousel. */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="min-w-0 flex-1">
          <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="shrink-0">All</TabsTrigger>
            {STATUS_ORDER.map((s) => (
              <TabsTrigger key={s} value={s} className="shrink-0">
                {STATUS_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, name, flight…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Fare</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No bookings match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((b) => {
                  const airport = getAirport(b.airportId)
                  const from = b.pickupAddress ?? (b.direction === "from-airport" ? airport?.name : b.destinationAddress)
                  const to = b.dropoffAddress ?? (b.direction === "from-airport" ? b.destinationAddress : airport?.name)
                  return (
                    <TableRow key={b.reference}>
                      <TableCell className="font-mono text-xs font-medium tracking-wider">
                        {b.reference}
                        {(b.returnTripReference || b.outboundTripReference) && (
                          <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-sans font-medium tracking-normal text-primary">
                            {b.outboundTripReference ? "Return" : "Outbound"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{b.customerName}</div>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{from}</span> →{" "}
                        <span className="text-muted-foreground">{to}</span>
                        {b.stops.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{b.stops.length} stop{b.stops.length > 1 ? "s" : ""} ({formatCurrency(b.stopsTotal)})
                          </div>
                        )}
                        {b.flightNumber && (
                          <div className="text-xs text-muted-foreground">
                            Flight {b.flightNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatShort(b.pickupDate)}
                        <div className="text-xs text-muted-foreground">{b.pickupTime}</div>
                      </TableCell>
                      <TableCell className="text-sm">{getVehicle(b.vehicleId)?.name}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(b.fare)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          {b.paymentMethod === "cash" ? (
                            <Banknote className="size-3.5" />
                          ) : (
                            <CreditCard className="size-3.5" />
                          )}
                          {b.paymentMethod === "cash" ? "Cash" : "Card"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={b.status}
                          onValueChange={(v) => changeStatus(b.reference, v as BookingStatus)}
                          disabled={isPending}
                        >
                          <SelectTrigger className="h-auto border-none bg-transparent p-0 shadow-none focus-visible:ring-0">
                            <Badge variant="outline" className={STATUS_STYLES[b.status]}>
                              {STATUS_LABELS[b.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_ORDER.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedBooking(b)}><Eye className="size-3.5" />View</Button><Button size="sm" variant="outline" onClick={() => setEditingBooking(b)}><Pencil className="size-3.5" />Edit</Button><Button size="sm" variant="outline" onClick={() => sendInvoice(b.reference)} disabled={isSendingInvoice && sendingInvoiceRef === b.reference}><Receipt className="size-3.5" />{isSendingInvoice && sendingInvoiceRef === b.reference ? "Sending…" : "Invoice"}</Button></div></TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</Button>
            </div>
          </div>
        )}
      </div>
      {selectedBooking && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Booking details"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"><div className="mb-2 flex justify-end"><Button variant="secondary" size="icon-sm" onClick={() => setSelectedBooking(null)} aria-label="Close booking details"><X /></Button></div><BookingDetails booking={selectedBooking} /></div></div>}
      {editingBooking && <EditBookingDialog booking={editingBooking} vehicles={vehicles} addOns={addOns} onClose={() => setEditingBooking(null)} />}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function formatShort(value: string): string {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
