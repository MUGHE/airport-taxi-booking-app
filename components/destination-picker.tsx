"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"

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
    if ((window as any).google?.maps?.places) return resolve()
    ;(window as any).__initGMaps = () => resolve()
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__initGMaps`
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const onSelectRef = useRef(onSelect)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError("Google Maps is not configured.")
      return
    }
    if (!inputRef.current) return
    let cancelled = false

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !inputRef.current) return
      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        inputRef.current,
        { fields: ["place_id", "formatted_address", "geometry"] },
      )
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        const location = place?.geometry?.location
        if (!place || !location) return
        const address = place.formatted_address ?? inputRef.current?.value ?? ""
        setValue(address)
        onSelectRef.current({
          placeId: place.place_id ?? "",
          address,
          lat: location.lat(),
          lng: location.lng(),
        })
      })
      setReady(true)
    }).catch(() => {
      if (!cancelled) setError("Google Maps suggestions could not be loaded.")
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (e.nativeEvent.isTrusted) onClear?.()
          }}
          placeholder={placeholder}
          className="pl-8"
          autoComplete="off"
        />
        {!ready && !error && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
