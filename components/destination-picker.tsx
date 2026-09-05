"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Loader2, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PlaceSelection {
  placeId: string
  address: string
  lat: number
  lng: number
}

type Suggestion = {
  id: string
  main: string
  secondary: string
  prediction: any
}

let mapsPromise: Promise<void> | null = null

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (mapsPromise) {
    return mapsPromise
  }

  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.importLibrary) {
      resolve()
      return
    }

    const callbackName = "__initGMaps"

    ;(window as any)[callbackName] = () => {
      resolve()
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    )

    if (existingScript) {
      return
    }

    const script = document.createElement("script")

    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&loading=async` +
      `&v=weekly` +
      `&callback=${callbackName}`

    script.async = true
    script.defer = true

    script.onerror = () => {
      mapsPromise = null
      reject(new Error("Failed to load Google Maps JavaScript API"))
    }

    document.head.appendChild(script)
  })

  return mapsPromise
}

// Reads Google's "formattable text" values, which sometimes come back as a plain string and
// sometimes as an object with a `.text` field — same defensive shape used for displayName below.
function textOf(value: any): string {
  if (typeof value === "string") return value
  return value?.text ?? ""
}

export function DestinationPicker({
  defaultValue = "",
  onSelect,
  onClear,
  placeholder = "Enter an address",
}: {
  defaultValue?: string
  onSelect: (place: PlaceSelection) => void
  onClear?: () => void
  placeholder?: string
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const onSelectRef = useRef(onSelect)
  const onClearRef = useRef(onClear)

  const placesLibRef = useRef<{ AutocompleteSuggestion: any; AutocompleteSessionToken: any } | null>(null)
  // One session token per "search session" (typing → either a selection or abandoning it),
  // per Google's billing guidance — reused across keystrokes, discarded after a selection.
  const sessionTokenRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [focused, setFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => setMounted(true), [])

  // The dropdown is portalled to <body> and positioned in fixed coordinates (see below) so it
  // is never clipped by an ancestor's overflow — a scrollable modal (the admin edit dialog) or
  // a card with rounded corners (the homepage fare estimator) would otherwise cut it off.
  useEffect(() => {
    if (!open) return
    function updateRect() {
      const el = wrapperRef.current
      if (!el) return
      const box = el.getBoundingClientRect()
      setRect({ top: box.bottom, left: box.left, width: box.width })
    }
    updateRect()
    window.addEventListener("scroll", updateRect, true)
    window.addEventListener("resize", updateRect)
    return () => {
      window.removeEventListener("scroll", updateRect, true)
      window.removeEventListener("resize", updateRect)
    }
  }, [open])

  // visualViewport only shrinks when a real on-screen keyboard opens (a desktop focus never
  // fires this, so this is naturally mobile-only), and that happens on focus — before the user
  // has typed anything or any results exist — so this tracks focus, not the dropdown's open
  // state. Only scrolls when the field (or the room a results list needs below it) would
  // actually end up hidden behind the keyboard — a field already comfortably visible (e.g.
  // drop-off, sitting right under pickup) shouldn't jump to the top and bury what's above it.
  useEffect(() => {
    if (!focused) return
    const viewport = (window as any).visualViewport
    if (!viewport) return

    // The resize event also fires when the keyboard CLOSES (viewport grows back) — only
    // consider a shrink, or closing the keyboard re-triggers an unwanted scroll-up.
    let lastHeight = viewport.height
    // Minimum room a results list needs below the field to be useful — not the full list,
    // just enough that it doesn't read as "hidden".
    const MIN_SPACE_BELOW = 150

    function handleViewportResize() {
      const shrank = viewport.height < lastHeight
      lastHeight = viewport.height
      if (!shrank) return

      const box = wrapperRef.current?.getBoundingClientRect()
      if (!box) return

      if (box.top < 0) {
        // Genuinely scrolled off the top already — bring it fully into view.
        wrapperRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
        return
      }

      const overflowBelow = box.bottom + MIN_SPACE_BELOW - viewport.height
      if (overflowBelow > 0) {
        // Scroll up by exactly the overlap, not all the way to the top — e.g. drop-off sits
        // right under pickup, and jumping to "top" would needlessly scroll pickup out of view.
        window.scrollBy({ top: overflowBelow, behavior: "smooth" })
      }
    }

    viewport.addEventListener("resize", handleViewportResize)
    return () => viewport.removeEventListener("resize", handleViewportResize)
  }, [focused])

  useEffect(() => {
    onSelectRef.current = onSelect
    onClearRef.current = onClear
  }, [onSelect, onClear])

  // Reflects an externally-driven change (the parent resetting or clearing its own state) —
  // matching this string is a no-op for the field the user is actively typing in.
  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.")
      setError("Google Maps is not configured.")
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        await loadGoogleMaps(apiKey)
        if (cancelled) return

        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          await (window as any).google.maps.importLibrary("places")
        if (cancelled) return

        placesLibRef.current = { AutocompleteSuggestion, AutocompleteSessionToken }
        setReady(true)
        setError("")
      } catch (initializationError) {
        console.error("Google Maps Places initialization failed:", initializationError)
        if (!cancelled) setError("Google Maps suggestions could not be loaded.")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function fetchSuggestions(query: string) {
    const lib = placesLibRef.current
    if (!lib) return

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new lib.AutocompleteSessionToken()
    }

    const requestId = ++requestIdRef.current
    setLoadingSuggestions(true)

    lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: query,
      sessionToken: sessionTokenRef.current,
      includedRegionCodes: ["gb"],
    })
      .then((response: any) => {
        if (requestId !== requestIdRef.current) return // a newer keystroke's request has since landed
        const next: Suggestion[] = (response?.suggestions ?? [])
          .map((suggestion: any) => suggestion.placePrediction)
          .filter(Boolean)
          .map((prediction: any) => ({
            id: prediction.placeId ?? textOf(prediction.text),
            main: textOf(prediction.mainText) || textOf(prediction.text),
            secondary: textOf(prediction.secondaryText),
            prediction,
          }))
        setSuggestions(next)
        setHighlighted(-1)
        setOpen(true)
      })
      .catch((suggestionError: any) => {
        console.error("Google Maps autocomplete suggestions failed:", suggestionError)
        setSuggestions([])
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoadingSuggestions(false)
      })
  }

  function handleChange(next: string) {
    setValue(next)
    onClearRef.current?.()

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = next.trim()
    if (!trimmed) {
      requestIdRef.current++ // invalidate any in-flight request
      setSuggestions([])
      setOpen(false)
      setLoadingSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 200)
  }

  async function selectSuggestion(suggestion: Suggestion) {
    try {
      const place = suggestion.prediction.toPlace()
      await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] })

      if (!place.location) {
        console.warn("Selected Google Place does not contain a location.", place)
        return
      }

      // Google can return a broad formatted address for stations and landmarks (for example,
      // "Hounslow, UK"). Preserve the place's display name so customers can recognise their
      // exact selection.
      const displayName = typeof place.displayName === "string" ? place.displayName : place.displayName?.text ?? ""
      const formattedAddress = place.formattedAddress ?? ""
      const address =
        displayName && formattedAddress && !formattedAddress.toLocaleLowerCase().includes(displayName.toLocaleLowerCase())
          ? `${displayName}, ${formattedAddress}`
          : displayName || formattedAddress

      const selection: PlaceSelection = {
        placeId: place.id ?? "",
        address,
        lat: place.location.lat(),
        lng: place.location.lng(),
      }

      setValue(address)
      setOpen(false)
      setSuggestions([])
      sessionTokenRef.current = null // next search starts a fresh (separately-billed) session
      onSelectRef.current(selection)
    } catch (selectionError) {
      console.error("Google Maps place selection failed:", selectionError)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlighted((i) => (i + 1) % suggestions.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (event.key === "Enter") {
      if (highlighted >= 0) {
        event.preventDefault()
        selectSuggestion(suggestions[highlighted])
      }
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const showSpinner = (!ready && !error) || loadingSuggestions

  return (
    // scroll-mt-10 (40px) keeps a little breathing room above the field when it's scrolled
    // into view — flush against the very top edge looks cramped.
    <div ref={wrapperRef} className="relative min-w-0 scroll-mt-10">
      <MapPin className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={value}
        placeholder={placeholder}
        disabled={!ready && !error}
        className="pl-8 pr-8"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true) }}
        // Suggestion buttons keep focus on the input via onMouseDown's preventDefault, so this
        // only fires for a genuine focus-away (clicking elsewhere, tabbing out) — safe to close.
        onBlur={() => { setFocused(false); setOpen(false) }}
      />

      {showSpinner && (
        <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {/* Our own dropdown — typing and results both live in this field, instead of Google's
          PlaceAutocompleteElement, which takes over the whole screen on mobile. Portalled to
          <body> in fixed coordinates so no ancestor's overflow/rounded-corner clipping can cut
          the results off (a real bug: the homepage fare estimator card and the admin edit
          dialog both scroll/clip their contents). */}
      {mounted && open && rect && (suggestions.length > 0 || (!loadingSuggestions && value.trim())) &&
        createPortal(
          <div
            className="fixed z-50 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md"
            style={{ top: rect.top + 4, left: rect.left, width: rect.width }}
          >
            {suggestions.length === 0 && !loadingSuggestions ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                    index === highlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{suggestion.main}</span>
                    {suggestion.secondary && (
                      <span className="block truncate text-xs text-muted-foreground">{suggestion.secondary}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body
        )}

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
