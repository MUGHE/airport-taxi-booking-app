"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface TripMapProps {
  originLat: number
  originLng: number
  originLabel: string
  originTime?: string
  destLat: number
  destLng: number
  destLabel: string
  destTime?: string
  waypoints?: { lat: number; lng: number; address: string }[]
  className?: string
}

let mapsPromise: Promise<void> | null = null

function loadGoogleMaps(apiKey: string): Promise<void> {
  // 1. Guard against SSR environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("SSR environment"))
  }

  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.importLibrary) {
      resolve()
      return
    }

    const callbackName = "__initGMapsTripMap"
    ;(window as any)[callbackName] = () => resolve()

    // 2. Safe check for existing script tag on client
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    )

    if (existingScript) {
      const check = () => {
        if ((window as any).google?.maps?.importLibrary) resolve()
        else setTimeout(check, 100)
      }
      check()
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&loading=async&v=weekly&callback=${callbackName}`
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

export function TripMap({
  originLat,
  originLng,
  originLabel,
  originTime,
  destLat,
  destLng,
  destLabel,
  destTime,
  waypoints = [],
  className,
}: TripMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  // 3. Early return for invalid or unparsed coordinates
  const isValidCoords =
    Number.isFinite(originLat) &&
    Number.isFinite(originLng) &&
    Number.isFinite(destLat) &&
    Number.isFinite(destLng)
  // Stable key so the effect only re-runs when the actual waypoints change, not on every
  // render (the array is a new reference each time otherwise).
  const waypointsKey = waypoints.map((w) => `${w.lat},${w.lng}`).join("|")

  useEffect(() => {
    if (!isValidCoords) {
      setError("Invalid map location.")
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError("Google Maps key is not configured.")
      return
    }

    let cancelled = false

    async function init() {
      try {
        await loadGoogleMaps(apiKey!)
        if (cancelled || !hostRef.current) return

        const g = (window as any).google
        if (!g?.maps?.importLibrary) return

        const { Map } = await g.maps.importLibrary("maps")
        const { DirectionsService, DirectionsRenderer } = await g.maps.importLibrary("routes")

        const map = new Map(hostRef.current, {
          center: { lat: originLat, lng: originLng },
          zoom: 11,
          disableDefaultUI: true,
          zoomControl: true,
        })

        new g.maps.Marker({
          position: { lat: originLat, lng: originLng },
          map,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        })

        new g.maps.Marker({ position: { lat: destLat, lng: destLng }, map })

        waypoints.forEach((point, index) => {
          new g.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map,
            label: { text: String(index + 1), color: "#ffffff", fontSize: "11px", fontWeight: "600" },
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#f59e0b",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          })
        })

        const directionsRenderer = new DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: "#111827", strokeWeight: 4 },
        })

        new DirectionsService().route(
          {
            origin: { lat: originLat, lng: originLng },
            destination: { lat: destLat, lng: destLng },
            waypoints: waypoints.map((point) => ({ location: { lat: point.lat, lng: point.lng }, stopover: true })),
            travelMode: g.maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (cancelled) return
            if (status === "OK") {
              directionsRenderer.setDirections(result)
            } else {
              const bounds = new g.maps.LatLngBounds()
              bounds.extend({ lat: originLat, lng: originLng })
              bounds.extend({ lat: destLat, lng: destLng })
              waypoints.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }))
              map.fitBounds(bounds, 64)
            }
          }
        )

        if (!cancelled) setReady(true)
      } catch (err) {
        console.error("Trip map failed to load:", err)
        if (!cancelled) setError("Couldn't load the map.")
      }
    }

    init()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destLat, destLng, isValidCoords, waypointsKey])

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border", className)}>
      <div ref={hostRef} className="h-64 w-full bg-secondary sm:h-72" />

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary px-4 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {ready && (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center gap-2 rounded-xl bg-card/95 px-3 py-2 shadow-md backdrop-blur">
          <span className="flex size-2.5 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Pick up</p>
            <p className="truncate text-sm font-medium">{originLabel}</p>
          </div>
          {originTime && (
            <span className="shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              {originTime}
            </span>
          )}
        </div>
      )}

      {ready && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl bg-card/95 px-3 py-2 shadow-md backdrop-blur">
          <span className="flex size-2.5 shrink-0 rounded-full bg-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Drop-off</p>
            <p className="truncate text-sm font-medium">{destLabel}</p>
          </div>
          {destTime && (
            <span className="shrink-0 rounded-lg bg-foreground px-2 py-1 text-xs font-semibold text-background">
              {destTime}
            </span>
          )}
        </div>
      )}
    </div>
  )
}