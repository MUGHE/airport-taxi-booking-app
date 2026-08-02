"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"

export interface PlaceSelection {
  placeId: string
  address: string
  lat: number
  lng: number
}

let mapsPromise: Promise<void> | null = null

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.importLibrary) return resolve()
    ;(window as any).__initGMaps = () => resolve()

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&v=weekly&callback=__initGMaps`
    script.async = true
    script.onerror = () => reject(new Error("Failed to load Google Maps"))
    document.head.appendChild(script)
  })

  return mapsPromise
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
  const hostRef = useRef<HTMLDivElement | null>(null)
  const onSelectRef = useRef(onSelect)
  const onClearRef = useRef(onClear)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    onSelectRef.current = onSelect
    onClearRef.current = onClear
  }, [onSelect, onClear])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError("Google Maps is not configured.")
      return
    }
    if (!hostRef.current) return

    let cancelled = false
    let autocomplete: HTMLElement | null = null
    let handleInput: (() => void) | undefined
    let handleSelect: ((event: Event) => Promise<void>) | undefined

    loadGoogleMaps(apiKey)
      .then(async () => {
        const { PlaceAutocompleteElement } = await (window as any).google.maps.importLibrary("places")
        if (cancelled || !hostRef.current) return

        autocomplete = new PlaceAutocompleteElement()

        ;(autocomplete as any).placeholder = placeholder
        ;(autocomplete as any).value = defaultValue
        const emptyIcon = document.createElement("span")
        emptyIcon.slot = "input-icon"
        autocomplete.appendChild(emptyIcon)
        autocomplete.style.width = "100%"
        autocomplete.style.maxWidth = "100%"
        autocomplete.style.borderRadius = "var(--radius-lg)"
        autocomplete.style.border = "1px solid var(--input)"
        autocomplete.style.backgroundColor = "transparent"

        handleInput = () => onClearRef.current?.()
        handleSelect = async (event: Event) => {
          const placePrediction = (event as any).placePrediction ?? (event as CustomEvent).detail?.placePrediction
          if (!placePrediction) return

          const place = placePrediction.toPlace()
          await place.fetchFields({ fields: ["id", "formattedAddress", "location"] })
          if (cancelled || !place.location) return

          const address = place.formattedAddress ?? ""
          onSelectRef.current({
            placeId: place.id ?? "",
            address,
            lat: place.location.lat(),
            lng: place.location.lng(),
          })
        }

        autocomplete.addEventListener("input", handleInput)
        autocomplete.addEventListener("gmp-select", handleSelect)
        hostRef.current.replaceChildren(autocomplete)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setError("Google Maps suggestions could not be loaded.")
      })

    return () => {
      cancelled = true
      if (autocomplete && handleInput) autocomplete.removeEventListener("input", handleInput)
      if (autocomplete && handleSelect) autocomplete.removeEventListener("gmp-select", handleSelect)
    }
  }, [defaultValue, placeholder])

  return (
    <div className="min-w-0">
      <div className="relative min-w-0 overflow-hidden rounded-lg">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <div
          ref={hostRef}
          className="h-8 min-w-0 [&>gmp-place-autocomplete]:block [&>gmp-place-autocomplete]:h-full [&>gmp-place-autocomplete]:max-w-full [&>gmp-place-autocomplete]:w-full"
        />
        {!ready && !error && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
