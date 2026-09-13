"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, MapPin, PlaneTakeoff, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AirportPagePresentation } from "@/lib/airport-page-data"

export function AirportQuoteActions({ page, onDarkBackground = false }: { page: AirportPagePresentation; onDarkBackground?: boolean }) {
  if (page.bookingAvailable === false) return <div className="airport-quote-card mt-7 p-5 text-center"><p className="font-semibold text-foreground">Online booking is temporarily unavailable</p><p className="mt-1 text-sm text-muted-foreground">Please contact our team and we’ll help arrange your transfer.</p><Button size="lg" className="mt-4" nativeButton={false} render={<Link href="/contact" />}>Contact us</Button></div>
  const primary = page.terminals.find((terminal) => terminal.isPrimary) ?? page.terminals[0]
  const [terminalId, setTerminalId] = useState(primary?.id ?? "")
  const terminal = page.terminals.find((item) => item.id === terminalId) ?? primary
  const links = terminal ? {
    toAirport: `/book?${new URLSearchParams({ dropoffAddress: terminal.name, dropoffLat: String(terminal.latitude), dropoffLng: String(terminal.longitude) })}`,
    fromAirport: `/book?${new URLSearchParams({ pickupAddress: terminal.name, pickupLat: String(terminal.latitude), pickupLng: String(terminal.longitude) })}`,
  } : page.bookingLinks
  const returnBookingLink = `${links.toAirport}${links.toAirport.includes("?") ? "&" : "?"}returnTrip=1`
  return <div className="airport-quote-card mt-7 w-full max-w-xl p-3 text-foreground sm:p-4">
    <div className="mb-3 flex gap-1 rounded-lg bg-secondary p-1 text-xs font-semibold" role="group" aria-label="Trip type">
      <span className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-primary-foreground">One way</span>
      <Link href={returnBookingLink} className="flex-1 rounded-md px-3 py-2 text-center text-muted-foreground hover:bg-background/70 hover:text-foreground">Return</Link>
    </div>
    {page.terminals.length > 1 && <label className="flex flex-col gap-1.5 text-left text-xs font-semibold text-foreground"><span>Airport terminal</span><select aria-label="Airport terminal" className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground" value={terminal?.id ?? ""} onChange={(event) => setTerminalId(event.target.value)}>{page.terminals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <div className="flex min-h-14 items-center gap-2 rounded-lg border border-input bg-background px-3"><MapPin className="size-4 shrink-0 text-primary" /><div><p className="text-[11px] text-muted-foreground">Pickup location</p><p className="text-sm font-medium">Enter pickup location</p></div></div>
      <div className="flex min-h-14 items-center gap-2 rounded-lg border border-input bg-background px-3"><PlaneTakeoff className="size-4 shrink-0 text-primary" /><div><p className="text-[11px] text-muted-foreground">Airport</p><p className="text-sm font-medium">{terminal?.name ?? page.shortName}</p></div></div>
    </div>
    <div className="mt-2 grid gap-2"><Button className="min-h-11 w-full whitespace-normal px-3 text-center text-sm leading-tight" size="lg" nativeButton={false} render={<Link href={links.toAirport} />}>Get a fixed price to {page.shortName} <ArrowRight className="size-4 shrink-0" /></Button><Button size="lg" variant="outline" className="min-h-11 w-full whitespace-normal px-3 text-center text-sm leading-tight" nativeButton={false} render={<Link href={links.fromAirport} />}><Route className="size-4 shrink-0" /> {page.shortName} to your destination</Button></div>
    <p className="mt-3 text-center text-xs text-muted-foreground">Need help? <Link className="font-semibold underline" href="/contact">Contact us</Link>.</p>
  </div>
}
