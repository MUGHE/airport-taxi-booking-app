"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AirportPagePresentation } from "@/lib/airport-page-data"

export function AirportQuoteActions({ page, onDarkBackground = false }: { page: AirportPagePresentation; onDarkBackground?: boolean }) {
  if (page.bookingAvailable === false) return <div className="mt-7 rounded-xl border border-background/25 bg-background/10 p-4 text-center"><p className="font-medium">Online booking is temporarily unavailable</p><p className="mt-1 text-sm opacity-80">Please contact our team and we’ll help arrange your transfer.</p><Button size="lg" className="mt-4" nativeButton={false} render={<Link href="/contact" />}>Contact us</Button></div>
  const primary = page.terminals.find((terminal) => terminal.isPrimary) ?? page.terminals[0]
  const [terminalId, setTerminalId] = useState(primary?.id ?? "")
  const terminal = page.terminals.find((item) => item.id === terminalId) ?? primary
  const links = terminal ? {
    toAirport: `/book?${new URLSearchParams({ dropoffAddress: terminal.name, dropoffLat: String(terminal.latitude), dropoffLng: String(terminal.longitude) })}`,
    fromAirport: `/book?${new URLSearchParams({ pickupAddress: terminal.name, pickupLat: String(terminal.latitude), pickupLng: String(terminal.longitude) })}`,
  } : page.bookingLinks
  return <div className="mt-7 flex flex-col items-center justify-center gap-3">
    {page.terminals.length > 1 && <label className="flex w-full max-w-sm flex-col gap-1 text-left text-sm"><span className="font-medium">Airport terminal</span><select aria-label="Airport terminal" className="h-10 rounded-lg border border-input bg-background px-3 text-foreground" value={terminal?.id ?? ""} onChange={(event) => setTerminalId(event.target.value)}>{page.terminals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row"><Button size="lg" nativeButton={false} render={<Link href={links.toAirport} />}>Get a fixed price to {page.shortName}<ArrowRight className="size-4" /></Button><Button size="lg" variant="outline" className={onDarkBackground ? "border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background" : undefined} nativeButton={false} render={<Link href={links.fromAirport} />}>{page.shortName} to your destination</Button></div>
  </div>
}
