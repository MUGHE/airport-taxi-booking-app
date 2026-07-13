"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Car, CircleDollarSign, Search, TicketCheck } from "lucide-react"
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
import { updateBookingStatus } from "@/lib/actions"
import type { Booking, BookingStatus } from "@/lib/types"
import { toast } from "sonner"

type Filter = "all" | BookingStatus

export function AdminDashboard({ bookings }: { bookings: Booking[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

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
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {STATUS_ORDER.map((s) => (
              <TabsTrigger key={s} value={s}>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No bookings match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => {
                  const airport = getAirport(b.airportId)
                  const from = b.direction === "from-airport" ? airport?.name : b.destinationAddress
                  const to = b.direction === "from-airport" ? b.destinationAddress : airport?.name
                  return (
                    <TableRow key={b.reference}>
                      <TableCell className="font-mono text-xs font-medium tracking-wider">
                        {b.reference}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{b.customerName}</div>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{from}</span> →{" "}
                        <span className="text-muted-foreground">{to}</span>
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
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
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
