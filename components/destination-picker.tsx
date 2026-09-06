"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { ArrowLeft, Loader2, MapPin, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  fetchPlaceSuggestions,
  resolvePlace,
  usePlacesLibrary,
  type PlaceSelection,
  type PlaceSuggestion,
} from "@/lib/places"

export type { PlaceSelection } from "@/lib/places"

type Suggestion = PlaceSuggestion

// Phone-sized screens get the full-screen search sheet; anything wider keeps the inline dropdown.
// Matches Tailwind's `sm` breakpoint so the switch lines up with the rest of the layout.
const COMPACT_QUERY = "(max-width: 639px)"

function useIsCompact(): boolean {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY)
    const sync = () => setIsCompact(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  return isCompact
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
  const inlineInputRef = useRef<HTMLInputElement | null>(null)
  const sheetInputRef = useRef<HTMLInputElement | null>(null)

  const onSelectRef = useRef(onSelect)
  const onClearRef = useRef(onClear)

  // One session token per "search session" (typing → either a selection or abandoning it),
  // per Google's billing guidance — reused across keystrokes, discarded after a selection.
  const sessionTokenRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [mounted, setMounted] = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false) // inline dropdown (pointer / wide screens)
  const [sheetOpen, setSheetOpen] = useState(false) // full-screen search sheet (phones)
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number } | null>(null)

  const isCompact = useIsCompact()
  const { library, error } = usePlacesLibrary()
  const ready = library !== null

  useEffect(() => setMounted(true), [])

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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // The inline dropdown is portalled to <body> so no ancestor's overflow can clip it (the homepage
  // fare-estimator card and the admin edit dialog both clip their contents), and anchored in
  // DOCUMENT coordinates so the browser keeps it glued to the field as the page scrolls — no
  // per-frame JS, nothing to lag behind. Measured in a layout effect so it is right before paint.
  useLayoutEffect(() => {
    if (!dropdownOpen) return

    function measure() {
      const el = wrapperRef.current
      if (!el) return
      const box = el.getBoundingClientRect()
      setAnchor({ left: box.left + window.scrollX, top: box.bottom + window.scrollY + 6, width: box.width })
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [dropdownOpen])

  // Backstop for any path that opens the sheet outside a tap (keyboard navigation, restored
  // state): the gesture-time focus above is what raises the on-screen keyboard, this only makes
  // sure the caret is in the search field either way.
  useEffect(() => {
    if (!sheetOpen) return
    if (document.activeElement !== sheetInputRef.current) sheetInputRef.current?.focus()
  }, [sheetOpen])

  // While the sheet is up it owns the screen — stop the page behind it from scrolling.
  useEffect(() => {
    if (!sheetOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [sheetOpen])

  function fetchSuggestions(query: string) {
    const lib = library
    if (!lib) return

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new lib.AutocompleteSessionToken()
    }

    const requestId = ++requestIdRef.current
    setLoadingSuggestions(true)

    fetchPlaceSuggestions(lib, query, sessionTokenRef.current)
      .then((next) => {
        if (requestId !== requestIdRef.current) return // a newer keystroke's request has since landed
        setSuggestions(next)
        setHighlighted(-1)
        if (!isCompact) setDropdownOpen(true)
      })
      .catch((suggestionError: any) => {
        console.error("Google Maps autocomplete suggestions failed:", suggestionError)
        setSuggestions([])
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoadingSuggestions(false)
      })
  }

  // The places module can land after the first keystrokes; search whatever is already typed as
  // soon as it does, instead of leaving the field looking like it found nothing.
  useEffect(() => {
    if (!library) return
    const pending = value.trim()
    if (pending && suggestions.length === 0) fetchSuggestions(pending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library])

  function handleChange(next: string) {
    setValue(next)
    onClearRef.current?.()

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = next.trim()
    if (!trimmed) {
      requestIdRef.current++ // invalidate any in-flight request
      setSuggestions([])
      setDropdownOpen(false)
      setLoadingSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 200)
  }

  async function selectSuggestion(suggestion: Suggestion) {
    const selection = await resolvePlace(suggestion)
    if (!selection) return

    setValue(selection.address)
    setDropdownOpen(false)
    setSheetOpen(false)
    setSuggestions([])
    sessionTokenRef.current = null // next search starts a fresh (separately-billed) session
    onSelectRef.current(selection)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setDropdownOpen(false)
      closeSheet()
      return
    }
    if (suggestions.length === 0) return

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
    }
  }

  // One tap has to both open the sheet and raise the keyboard. Mobile browsers only raise it for a
  // focus() call made during the user's own gesture, and a `hidden` element cannot take focus at
  // all — so the state change is flushed synchronously here (un-hiding the input before the tap
  // handler returns) and only then is it focused, all still inside the gesture.
  function openSheet() {
    flushSync(() => setSheetOpen(true))
    sheetInputRef.current?.focus()
  }

  function closeSheet() {
    setSheetOpen(false)
    sheetInputRef.current?.blur()
  }

  function clearValue() {
    setValue("")
    setSuggestions([])
    setLoadingSuggestions(false)
    requestIdRef.current++
    onClearRef.current?.()
    sheetInputRef.current?.focus()
  }

  const disabled = !ready && !error
  const showInlineSpinner = disabled || loadingSuggestions
  const trimmed = value.trim()

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <MapPin className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

      {isCompact ? (
        // Phones: the field is a button that opens the search sheet. No inline dropdown to place,
        // no keyboard to scroll clear of — the sheet takes the screen and the list has all of it.
        <button
          type="button"
          disabled={disabled}
          onClick={openSheet}
          className={cn(
            "flex h-8 w-full items-center rounded-lg border border-input bg-transparent pl-8 pr-8 text-left text-base transition-colors",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <span className="truncate">{value || placeholder}</span>
        </button>
      ) : (
        <Input
          ref={inlineInputRef}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-8 pr-8"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setDropdownOpen(true)
          }}
          // Suggestion buttons keep focus on the input via onMouseDown's preventDefault, so this
          // only fires for a genuine focus-away (clicking elsewhere, tabbing out) — safe to close.
          onBlur={() => setDropdownOpen(false)}
        />
      )}

      {showInlineSpinner && (
        <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {/* Inline dropdown — pointer devices only. */}
      {mounted && !isCompact && dropdownOpen && anchor && (suggestions.length > 0 || (!loadingSuggestions && trimmed)) &&
        createPortal(
          <div
            className="absolute z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
            style={{ left: anchor.left, top: anchor.top, width: anchor.width }}
          >
            <SuggestionList
              suggestions={suggestions}
              highlighted={highlighted}
              loading={loadingSuggestions}
              onHighlight={setHighlighted}
              onPick={selectSuggestion}
              className="max-h-72 overflow-y-auto py-1"
            />
          </div>,
          document.body
        )}

      {/* Full-screen search sheet — phones only. Mounted for the whole time the screen is phone-
          sized (not just while open) so the tap that opens it can focus the input synchronously,
          which is the only way iOS raises the keyboard; `hidden` keeps it out of the layout and
          the accessibility tree in between. On wider screens it is not in the DOM at all. */}
      {mounted && isCompact &&
        createPortal(
          <div
            hidden={!sheetOpen}
            role="dialog"
            aria-modal="true"
            aria-label={placeholder}
            className="fixed inset-0 z-50 flex flex-col bg-background"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-3">
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close search"
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
              </button>

              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={sheetInputRef}
                  value={value}
                  placeholder={placeholder}
                  enterKeyHint="search"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestions.length > 0}
                  aria-autocomplete="list"
                  className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {value && (
                  <button
                    type="button"
                    onClick={clearValue}
                    aria-label="Clear"
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {error ? (
                <SheetMessage>{error}</SheetMessage>
              ) : !trimmed ? (
                <SheetMessage>Start typing to search for an address, postcode, or place.</SheetMessage>
              ) : loadingSuggestions && suggestions.length === 0 ? (
                <SheetMessage>
                  <Loader2 className="mr-2 inline size-4 animate-spin align-[-3px]" />
                  Searching&hellip;
                </SheetMessage>
              ) : suggestions.length === 0 ? (
                <SheetMessage>No matches for &ldquo;{trimmed}&rdquo;. Try a postcode or a nearby landmark.</SheetMessage>
              ) : (
                <SuggestionList
                  suggestions={suggestions}
                  highlighted={highlighted}
                  loading={false}
                  onHighlight={setHighlighted}
                  onPick={selectSuggestion}
                  compact
                />
              )}
            </div>
          </div>,
          document.body
        )}

      {error && !isCompact && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function SheetMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground">{children}</p>
}

function SuggestionList({
  suggestions,
  highlighted,
  loading,
  onHighlight,
  onPick,
  className,
  compact = false,
}: {
  suggestions: Suggestion[]
  highlighted: number
  loading: boolean
  onHighlight: (index: number) => void
  onPick: (suggestion: Suggestion) => void
  className?: string
  compact?: boolean
}) {
  if (suggestions.length === 0 && !loading) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
  }

  return (
    <div className={className} role="listbox">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          type="button"
          role="option"
          aria-selected={index === highlighted}
          // Keeps focus (and the keyboard) on the input while the press lands.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(suggestion)}
          onMouseEnter={() => onHighlight(index)}
          className={cn(
            "flex w-full items-start gap-3 text-left transition-colors",
            // Comfortable touch targets in the sheet; tighter rows for the pointer dropdown.
            compact ? "border-b border-border/60 px-4 py-3.5" : "px-3 py-2",
            index === highlighted ? "bg-accent/15" : "hover:bg-accent/15"
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground",
              compact ? "mt-0.5 size-9" : "mt-0.5 size-6"
            )}
          >
            <MapPin className={compact ? "size-4" : "size-3.5"} />
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate font-medium", compact ? "text-[15px]" : "text-sm")}>
              {suggestion.main}
            </span>
            {suggestion.secondary && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{suggestion.secondary}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
