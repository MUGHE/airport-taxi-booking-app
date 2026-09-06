"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { ArrowLeft, ArrowUpDown, Clock, Loader2, MapPinPlus, Plane, X } from "lucide-react"
import { AIRPORTS, formatCurrency } from "@/lib/fleet"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { fetchPlaceSuggestions, resolvePlace, type PlaceSelection, type PlaceSuggestion, usePlacesLibrary } from "@/lib/places"

/** Which point on the route the sheet is currently editing. A stop's `index` may be one past the
 *  end of the list, which means "a stop being added" — it only joins the route once picked. */
export type RouteLeg = { kind: "pickup" } | { kind: "dropoff" } | { kind: "stop"; index: number }

const RECENTS_KEY = "oat:recent-places"
const MAX_RECENTS = 4
// The terminals customers ask for most often — the full list lives in lib/fleet.ts and would bury
// the search field on a phone.
const QUICK_AIRPORT_IDS = ["lhr-t5", "lhr-t2", "lgw-north", "stn"]

function legKey(leg: RouteLeg): string {
  return leg.kind === "stop" ? `stop-${leg.index}` : leg.kind
}

function legLabel(leg: RouteLeg): string {
  if (leg.kind === "pickup") return "Pickup"
  if (leg.kind === "dropoff") return "Drop-off"
  return `Stop ${leg.index + 1}`
}

function legPlaceholder(leg: RouteLeg): string {
  if (leg.kind === "pickup") return "Where from?"
  if (leg.kind === "dropoff") return "Where to?"
  return "Where do we stop?"
}

function readRecents(): PlaceSelection[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    // Anything in storage was written by an older version of this app or edited by hand — keep
    // only entries that still have the shape the rest of the flow relies on.
    return parsed
      .filter(
        (entry: any) =>
          entry && typeof entry.address === "string" && Number.isFinite(entry.lat) && Number.isFinite(entry.lng)
      )
      .slice(0, MAX_RECENTS)
  } catch {
    return []
  }
}

function rememberRecent(place: PlaceSelection) {
  if (typeof window === "undefined") return
  try {
    const next = [place, ...readRecents().filter((entry) => entry.address !== place.address)].slice(0, MAX_RECENTS)
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    // A full or blocked storage quota must never break the booking flow.
  }
}

const QUICK_AIRPORTS: { place: PlaceSelection; area: string }[] = QUICK_AIRPORT_IDS.flatMap((id) => {
  const airport = AIRPORTS.find((item) => item.id === id)
  if (!airport) return []
  return [
    {
      place: { placeId: airport.id, address: airport.name, lat: airport.lat, lng: airport.lng },
      area: airport.area,
    },
  ]
})

function splitAddress(address: string): { main: string; secondary: string } {
  const separator = address.indexOf(", ")
  if (separator === -1) return { main: address, secondary: "" }
  return { main: address.slice(0, separator), secondary: address.slice(separator + 2) }
}

/** The rail running down the left of the route: a dot for pickup, a ring per stop, a square for
 *  drop-off, joined by dashed segments — so the shape of the journey reads at a glance. */
function RouteRail({ stopCount, activeIndex }: { stopCount: number; activeIndex: number }) {
  const points = 2 + stopCount
  return (
    <div className="flex flex-col items-center justify-center py-3.5">
      {Array.from({ length: points }).map((_, index) => {
        const isFirst = index === 0
        const isLast = index === points - 1
        const isActive = index === activeIndex
        return (
          <div key={index} className="contents">
            {index > 0 && (
              <span className="w-0.5 flex-1 bg-[repeating-linear-gradient(var(--color-border)_0_3px,transparent_3px_6px)]" />
            )}
            <span
              className={cn(
                "shrink-0",
                isFirst && "size-2.5 rounded-full",
                isLast && "size-2.5 rounded-[3px]",
                !isFirst && !isLast && "size-2 rounded-full border-2 border-current bg-background",
                isActive ? "text-primary" : "text-muted-foreground",
                isFirst || isLast ? (isActive ? "bg-primary" : "bg-muted-foreground") : undefined
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

export function RouteSearchSheet({
  open,
  leg,
  pickup,
  dropoff,
  stops,
  onLegChange,
  onPickupChange,
  onDropoffChange,
  onStopsChange,
  onClose,
  inputRef,
}: {
  open: boolean
  leg: RouteLeg
  pickup: PlaceSelection | null
  dropoff: PlaceSelection | null
  stops: PlaceSelection[]
  onLegChange: (leg: RouteLeg) => void
  onPickupChange: (place: PlaceSelection | null) => void
  onDropoffChange: (place: PlaceSelection | null) => void
  onStopsChange: (stops: PlaceSelection[]) => void
  onClose: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [recents, setRecents] = useState<PlaceSelection[]>([])

  const { library, error } = usePlacesLibrary()
  const sessionTokenRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const trimmed = query.trim()

  useEffect(() => setMounted(true), [])

  // Each leg searches from its own blank slate.
  useEffect(() => {
    if (!open) return
    setQuery("")
    setSuggestions([])
    setLoading(false)
    requestIdRef.current++
    setRecents(readRecents())
  }, [open, legKey(leg)])

  // Switching legs (by tapping another row, or automatically after a pick) has to carry the caret
  // with it — otherwise the sheet looks ready for typing while the keystrokes go nowhere.
  useEffect(() => {
    if (!open) return
    if (document.activeElement !== inputRef.current) inputRef.current?.focus()
  }, [open, legKey(leg), inputRef])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const runSearch = useCallback(
    (value: string) => {
      if (!library) return
      if (!sessionTokenRef.current) sessionTokenRef.current = new library.AutocompleteSessionToken()
      const requestId = ++requestIdRef.current
      setLoading(true)
      fetchPlaceSuggestions(library, value, sessionTokenRef.current)
        .then((next) => {
          if (requestId !== requestIdRef.current) return // a newer keystroke has landed
          setSuggestions(next)
        })
        .catch((searchError) => {
          console.error("Google Maps autocomplete suggestions failed:", searchError)
          if (requestId === requestIdRef.current) setSuggestions([])
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false)
        })
    },
    [library]
  )

  // Google's places module can take a few seconds to arrive. Anything typed in the meantime must
  // still be searched the moment it lands, or the query is silently dropped and the customer is
  // told there are no matches for an address that exists.
  useEffect(() => {
    if (!open || !library) return
    const pending = query.trim()
    if (pending && suggestions.length === 0) runSearch(pending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, open])

  function handleQueryChange(next: string) {
    setQuery(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const value = next.trim()
    if (!value) {
      requestIdRef.current++
      setSuggestions([])
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(value), 200)
  }

  function commit(place: PlaceSelection) {
    rememberRecent(place)
    sessionTokenRef.current = null // a completed search closes its billing session

    if (leg.kind === "pickup") {
      onPickupChange(place)
      // Drop-off still blank? Stay in the sheet and move straight on to it, which is the whole
      // point of holding the route together here.
      if (!dropoff) {
        onLegChange({ kind: "dropoff" })
        return
      }
    } else if (leg.kind === "dropoff") {
      onDropoffChange(place)
      if (!pickup) {
        onLegChange({ kind: "pickup" })
        return
      }
    } else {
      // A stop only joins the route once it has a place — an abandoned "add" leaves nothing behind.
      const next = [...stops]
      if (leg.index < next.length) next[leg.index] = place
      else next.push(place)
      onStopsChange(next)
      if (!dropoff) {
        onLegChange({ kind: "dropoff" })
        return
      }
    }
    onClose()
  }

  async function pickSuggestion(suggestion: PlaceSuggestion) {
    const place = await resolvePlace(suggestion)
    if (place) {
      commit(place)
      return
    }
    // Google occasionally fails to return details for a prediction; without this the tap looks
    // like it did nothing at all.
    toast.error("Couldn't load that address. Please pick another.")
  }

  function removeStop(index: number) {
    onStopsChange(stops.filter((_, position) => position !== index))
    onLegChange({ kind: "dropoff" })
  }

  if (!mounted) return null

  const rows: { leg: RouteLeg; place: PlaceSelection | null; removable: boolean }[] = [
    { leg: { kind: "pickup" }, place: pickup, removable: false },
    ...stops.map((stop, index) => ({ leg: { kind: "stop" as const, index }, place: stop, removable: true })),
    { leg: { kind: "dropoff" }, place: dropoff, removable: false },
  ]
  // A stop being added has no row of its own yet; it edits in place at the end of the stop list.
  const addingStop = leg.kind === "stop" && leg.index >= stops.length
  if (addingStop) {
    rows.splice(rows.length - 1, 0, { leg, place: null, removable: false })
  }
  const activeIndex = rows.findIndex((row) => legKey(row.leg) === legKey(leg))

  return createPortal(
    <div
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Plan your route"
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="flex items-center gap-1 px-1 py-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close route search"
          className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="text-lg font-semibold tracking-tight">Plan your route</h2>
      </div>

      <div className="mx-4 flex items-stretch gap-3 rounded-xl border border-border bg-card py-2 pl-3.5 pr-3 shadow-sm">
        <RouteRail stopCount={rows.length - 2} activeIndex={activeIndex} />

        <div className="flex min-w-0 flex-1 flex-col">
          {rows.map((row, index) => {
            const rowLeg = row.leg
            return (
            <div key={legKey(rowLeg)} className="contents">
              {index > 0 && <span className="h-px bg-border" />}
              <RouteField
                label={legLabel(rowLeg)}
                placeholder={legPlaceholder(rowLeg)}
                value={row.place?.address ?? ""}
                activeValue={query}
                isActive={legKey(rowLeg) === legKey(leg)}
                removable={row.removable}
                inputRef={inputRef}
                onActivate={() => onLegChange(rowLeg)}
                onChange={handleQueryChange}
                onRemove={rowLeg.kind === "stop" ? () => removeStop(rowLeg.index) : undefined}
                onClear={() => {
                  setQuery("")
                  setSuggestions([])
                  if (rowLeg.kind === "pickup") onPickupChange(null)
                  else if (rowLeg.kind === "dropoff") onDropoffChange(null)
                  else if (rowLeg.index < stops.length) removeStop(rowLeg.index)
                  inputRef.current?.focus()
                }}
              />
            </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            onPickupChange(dropoff)
            onDropoffChange(pickup)
            onStopsChange([...stops].reverse())
          }}
          aria-label="Swap pickup and drop-off"
          className="flex size-10 shrink-0 items-center justify-center self-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpDown className="size-4" />
        </button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        {error ? (
          <Message>{error}</Message>
        ) : trimmed ? (
          (loading || !library) && suggestions.length === 0 ? (
            <Message>
              <Loader2 className="mr-2 inline size-4 animate-spin align-[-3px]" />
              Searching&hellip;
            </Message>
          ) : suggestions.length === 0 ? (
            <Message>No matches for &ldquo;{trimmed}&rdquo;. Try a postcode or a nearby landmark.</Message>
          ) : (
            <div className="flex flex-col">
              {suggestions.map((suggestion) => (
                <Row
                  key={suggestion.id}
                  icon={<Plane className="size-[18px]" />}
                  main={suggestion.main}
                  secondary={suggestion.secondary}
                  onPick={() => pickSuggestion(suggestion)}
                />
              ))}
            </div>
          )
        ) : (
          <>
            {recents.length > 0 && (
              <section>
                <SectionHead>Recent</SectionHead>
                <div className="flex flex-col">
                  {recents.map((place) => {
                    const { main, secondary } = splitAddress(place.address)
                    return (
                      <Row
                        key={`${place.placeId}-${place.address}`}
                        icon={<Clock className="size-[18px]" />}
                        main={main}
                        secondary={secondary}
                        onPick={() => commit(place)}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            <section className={recents.length > 0 ? "mt-5" : undefined}>
              <SectionHead>Airports</SectionHead>
              <div className="flex flex-col">
                {QUICK_AIRPORTS.map(({ place, area }) => (
                  <Row
                    key={place.placeId}
                    icon={<Plane className="size-[19px]" />}
                    main={place.address}
                    secondary={area}
                    onPick={() => commit(place)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

function RouteField({
  label,
  placeholder,
  value,
  activeValue,
  isActive,
  removable,
  inputRef,
  onActivate,
  onChange,
  onClear,
  onRemove,
}: {
  label: string
  placeholder: string
  value: string
  activeValue: string
  isActive: boolean
  removable: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onActivate: () => void
  onChange: (value: string) => void
  onClear: () => void
  onRemove?: () => void
}) {
  // The active leg is the only real input; the others are buttons that hand focus over when
  // tapped, so there is exactly one caret and the keyboard never has to close in between.
  if (!isActive) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={onActivate}
          className="flex min-h-[46px] min-w-0 flex-1 items-center text-left text-[15px]"
        >
          <span className={cn("truncate", value ? "text-foreground" : "text-muted-foreground")}>
            {value || placeholder}
          </span>
        </button>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="my-0.5 flex min-h-[46px] items-center gap-2 rounded-xl bg-primary/[0.07] px-2.5 ring-[1.5px] ring-inset ring-primary">
      <input
        ref={inputRef}
        value={activeValue}
        placeholder={value || placeholder}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        onChange={(event) => onChange(event.target.value)}
      />
      {(activeValue || value) && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-5 pb-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">{children}</h3>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-6 text-sm text-muted-foreground">{children}</p>
}

function Row({
  icon,
  main,
  secondary,
  onPick,
}: {
  icon: React.ReactNode
  main: string
  secondary?: string
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()} // keep the caret (and keyboard) in place
      onClick={onPick}
      className="flex min-h-[60px] w-full items-center gap-3.5 px-5 py-2 text-left transition-colors [&+&]:border-t [&+&]:border-border/55 hover:bg-accent/15"
    >
      <span className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{main}</span>
        {secondary && <span className="truncate text-[12.5px] text-muted-foreground">{secondary}</span>}
      </span>
    </button>
  )
}

/**
 * The collapsed route card that opens the sheet — the whole route (pickup, any stops, drop-off)
 * in one control, which is all the trip form renders on a phone.
 */
export function RouteCard({
  pickup,
  dropoff,
  stops,
  maxStops,
  pricePerStop,
  onPickupChange,
  onDropoffChange,
  onStopsChange,
}: {
  pickup: PlaceSelection | null
  dropoff: PlaceSelection | null
  stops: PlaceSelection[]
  maxStops: number
  pricePerStop: number
  onPickupChange: (place: PlaceSelection | null) => void
  onDropoffChange: (place: PlaceSelection | null) => void
  onStopsChange: (stops: PlaceSelection[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [leg, setLeg] = useState<RouteLeg>({ kind: "pickup" })
  const inputRef = useRef<HTMLInputElement | null>(null)

  // One tap has to both open the sheet and raise the keyboard: mobile browsers only raise it for a
  // focus() made during the tap, and a hidden element cannot take focus — so the open is flushed
  // synchronously here and the field focused before the handler returns.
  function openAt(nextLeg: RouteLeg) {
    flushSync(() => {
      setLeg(nextLeg)
      setOpen(true)
    })
    inputRef.current?.focus()
  }

  const rows: { leg: RouteLeg; label: string; placeholder: string; place: PlaceSelection | null }[] = [
    { leg: { kind: "pickup" }, label: "Pickup", placeholder: "Where from?", place: pickup },
    ...stops.map((stop, index) => ({
      leg: { kind: "stop" as const, index },
      label: `Stop ${index + 1}`,
      placeholder: "Where do we stop?",
      place: stop,
    })),
    { leg: { kind: "dropoff" }, label: "Drop-off", placeholder: "Where to?", place: dropoff },
  ]

  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-stretch gap-3 py-1.5 pl-3.5 pr-3">
          <RouteRail stopCount={stops.length} activeIndex={-1} />

          <div className="flex min-w-0 flex-1 flex-col">
            {rows.map((row, index) => {
              const rowLeg = row.leg
              return (
              <div key={legKey(rowLeg)} className="contents">
                {index > 0 && <span className="h-px bg-border" />}
                <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openAt(rowLeg)}
                    className="flex min-h-12 min-w-0 flex-1 flex-col justify-center gap-px text-left"
                  >
                    <span className="text-[11.5px] font-medium uppercase tracking-[0.02em] text-muted-foreground">
                      {row.label}
                    </span>
                    <span className={cn("truncate text-[15px]", row.place ? "text-foreground" : "text-muted-foreground")}>
                      {row.place?.address || row.placeholder}
                    </span>
                  </button>
                  {rowLeg.kind === "stop" && (
                    <button
                      type="button"
                      onClick={() => onStopsChange(stops.filter((_, position) => position !== rowLeg.index))}
                      aria-label={`Remove ${row.label.toLowerCase()}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onPickupChange(dropoff)
              onDropoffChange(pickup)
              onStopsChange([...stops].reverse())
            }}
            aria-label="Swap pickup and drop-off"
            disabled={!pickup && !dropoff}
            className="flex size-10 shrink-0 items-center justify-center self-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <ArrowUpDown className="size-4" />
          </button>
        </div>

        {stops.length < maxStops && (
          <button
            type="button"
            onClick={() => openAt({ kind: "stop", index: stops.length })}
            className="flex w-full items-center gap-2 border-t border-border px-3.5 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <MapPinPlus className="size-4 shrink-0" />
            Add a stop
            {pricePerStop > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                +{formatCurrency(pricePerStop)} each
              </span>
            )}
          </button>
        )}
      </div>

      <RouteSearchSheet
        open={open}
        leg={leg}
        pickup={pickup}
        dropoff={dropoff}
        stops={stops}
        onLegChange={setLeg}
        onPickupChange={onPickupChange}
        onDropoffChange={onDropoffChange}
        onStopsChange={onStopsChange}
        onClose={() => setOpen(false)}
        inputRef={inputRef}
      />
    </>
  )
}
