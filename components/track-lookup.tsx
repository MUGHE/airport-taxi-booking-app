"use client"

import { useState, useTransition } from "react"
import { Loader2, Search, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookingDetails } from "@/components/booking-details"
import { lookupBooking } from "@/lib/actions"
import type { Booking } from "@/lib/types"

export function TrackLookup() {
  const [reference, setReference] = useState("")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reference.trim()) return
    startTransition(async () => {
      const result = await lookupBooking(reference)
      setBooking(result)
      setNotFound(!result)
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={reference}
          onChange={(e) => {
            setReference(e.target.value.toUpperCase())
            setNotFound(false)
          }}
          placeholder="e.g. AT-7F3K9Q"
          className="font-mono uppercase tracking-wider"
          aria-label="Booking reference"
        />
        <Button type="submit" disabled={isPending || !reference.trim()}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Find booking
        </Button>
      </form>

      {notFound && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          <TriangleAlert className="size-4 text-amber-500" />
          No booking found for that reference. Double-check and try again.
        </div>
      )}

      {booking && (
        <div className="mt-6">
          <BookingDetails booking={booking} />
        </div>
      )}
    </div>
  )
}
