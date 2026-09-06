"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatTimeLabel } from "@/lib/datetime"
import { cn } from "@/lib/utils"

// Calendar-style time picker: a popover button (matching the pickup-date Calendar trigger)
// that opens a scrollable list of time slots, instead of a plain dropdown. Purely presentational —
// callers keep owning validation/state, same as before (value in, onChange out).
function TimePicker({
  value,
  onChange,
  times,
  placeholder = "Select time",
  className,
}: {
  value: string
  onChange: (value: string) => void
  times: string[]
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Jump to the selected slot (or the first available one) whenever the list opens, so a long
  // scroll of times doesn't strand the user far from their current pick.
  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]')
      el?.scrollIntoView({ block: "center" })
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className={cn("w-full justify-start gap-2 font-normal", className)} />}>
        <Clock className="size-4 text-muted-foreground" />
        {value ? formatTimeLabel(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1.5">
        <div ref={listRef} className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {times.map((t) => {
            const selected = t === value
            return (
              <button
                key={t}
                type="button"
                data-selected={selected}
                onClick={() => { onChange(t); setOpen(false) }}
                className={cn(
                  "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                  selected ? "bg-primary font-medium text-primary-foreground" : "hover:bg-accent",
                )}
              >
                {formatTimeLabel(t)}
              </button>
            )
          })}
          {times.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">No times available</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }
