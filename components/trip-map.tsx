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
  /** Short route info shown as a pill on the drop-off bar, e.g. "16.4 miles · ~38 mins". */
  routeBadge?: string
  className?: string
}

let mapsPromise: Promise<void> | null = null

// Google reports a rejected key (wrong referrer, API not enabled, billing) by calling the global
// window.gm_authFailure: the script itself still "loads", and the map just stays grey. Tracked here
// so every TripMap on the page can swap to the fallback.
let authFailed = false
const authFailureListeners = new Set<() => void>()
function watchAuthFailure(listener: () => void): () => void {
  if (typeof window !== "undefined" && !(window as any).__tripMapAuthHook) {
    ;(window as any).__tripMapAuthHook = true
    const previous = (window as any).gm_authFailure
    ;(window as any).gm_authFailure = () => {
      authFailed = true
      authFailureListeners.forEach((fn) => fn())
      if (typeof previous === "function") previous()
    }
  }
  authFailureListeners.add(listener)
  return () => { authFailureListeners.delete(listener) }
}

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
  routeBadge,
  className,
}: TripMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const fail = (reason: string) => { setReady(false); setError(reason) }

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
    setError("")
    setReady(false)
    if (!isValidCoords) {
      fail("Invalid map location.")
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      fail("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.")
      return
    }

    let cancelled = false
    let tilesLoaded = false
    const authMessage = `Google Maps rejected the browser key for ${window.location.host} (check its allowed referrers and that the Maps JavaScript API is enabled).`
    if (authFailed) {
      fail(authMessage)
      return
    }
    const stopWatching = watchAuthFailure(() => { if (!cancelled) fail(authMessage) })

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

        // Ready once Google has actually rendered (first "idle" or "tilesloaded"), not when the
        // map object exists: a rejected key creates the object fine and then never paints.
        const markReady = () => {
          tilesLoaded = true
          if (!cancelled && !authFailed) setReady(true)
        }
        g.maps.event.addListenerOnce(map, "idle", markReady)
        g.maps.event.addListenerOnce(map, "tilesloaded", markReady)
      } catch (err) {
        console.error("Trip map failed to load:", err)
        if (!cancelled) fail("The Google Maps script failed to load.")
      }
    }

    init()
    // Covers a script that never builds a map at all (blocked network, a silent key problem). If
    // Google did build one and it's only slow to report in (slow phone, deferred image loads),
    // keep the real map rather than swapping it for the sketch.
    const timeout = window.setTimeout(() => {
      if (cancelled || tilesLoaded || authFailed) return
      if (hostRef.current?.querySelector(".gm-style")) setReady(true)
      else setError((current) => current || "The map took too long to load.")
    }, 12000)
    return () => {
      cancelled = true
      stopWatching()
      window.clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destLat, destLng, isValidCoords, waypointsKey])

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border", className)}>
      <div ref={hostRef} aria-hidden={error ? true : undefined} className={cn("h-64 min-h-[260px] w-full bg-secondary sm:h-72", error && "invisible")} />

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
      {error && (
        <RouteSketch
          points={[{ lat: originLat, lng: originLng }, ...waypoints, { lat: destLat, lng: destLng }]}
          // The reason is for whoever is building the site; visitors only see the route sketch.
          diagnostic={process.env.NODE_ENV !== "production" ? error : undefined}
        />
      )}

      {(ready || error) && (
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

      {(ready || error) && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl bg-card/95 px-3 py-2 shadow-md backdrop-blur">
          <span className="flex size-2.5 shrink-0 rounded-full bg-foreground" />
          <div className="min-w-0 flex-1">
            {/* The route pill sits on the label's line, so the address below keeps the card's full width. */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-muted-foreground">Drop-off</p>
              {routeBadge && (
                <span className="shrink-0 whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-px text-[11px] font-semibold tabular-nums">
                  {routeBadge}
                </span>
              )}
            </div>
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
// Drawn when the Google map can't be shown: the trip's points in their real relative positions,
// joined in order on a soft grid, so the card still reads as a route instead of an empty box.
// Laid out in the card's real pixel size (measured), so the points always land in the clear
// band between the pick-up and drop-off bars however wide the card is.
function RouteSketch({ points, diagnostic }: { points: { lat: number; lng: number }[]; diagnostic?: string }) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  const W = size?.w || 340
  const H = size?.h || 288
  // The bars over the top and bottom are ~56px tall, inset 12px; keep points 16px clear of them.
  const PAD_X = 40
  const PAD_Y = Math.min(84, H / 2 - 12)
  const meanLat = valid.reduce((sum, p) => sum + p.lat, 0) / Math.max(valid.length, 1)
  const kx = Math.cos((meanLat * Math.PI) / 180)
  const xs = valid.map((p) => p.lng * kx)
  const ys = valid.map((p) => -p.lat)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = Math.min((W - PAD_X * 2) / Math.max(maxX - minX, 1e-6), (H - PAD_Y * 2) / Math.max(maxY - minY, 1e-6))
  const offX = (W - (maxX - minX) * scale) / 2
  const offY = (H - (maxY - minY) * scale) / 2
  const pts = valid.map((_, i) => ({ x: offX + (xs[i] - minX) * scale, y: offY + (ys[i] - minY) * scale }))
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")

  return (
    <div ref={boxRef} className="absolute inset-0 bg-secondary" role="img" aria-label="Route sketch from pick-up to drop-off">
      {size && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block text-foreground" aria-hidden="true">
          <defs>
            <pattern id="trip-sketch-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="currentColor" strokeOpacity=".06" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#trip-sketch-grid)" />
          {pts.length > 1 && <path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 7" />}
          {pts.map((p, i) =>
            i === 0
              ? <circle key={i} cx={p.x} cy={p.y} r="7" fill="#2563eb" stroke="#fff" strokeWidth="3" />
              : i === pts.length - 1
                ? <circle key={i} cx={p.x} cy={p.y} r="7" fill="currentColor" stroke="#fff" strokeWidth="3" />
                : <g key={i}><circle cx={p.x} cy={p.y} r="9" fill="#f59e0b" stroke="#fff" strokeWidth="2" /><text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">{i}</text></g>,
          )}
        </svg>
      )}
      {/* Development builds only (the caller passes nothing in production): why the real map is missing. */}
      {diagnostic && (
        <p className="absolute inset-x-3 top-[4.75rem] rounded-lg bg-card/90 px-3 py-1.5 text-center text-[11px] leading-snug text-muted-foreground shadow-sm">
          Map unavailable: {diagnostic}
        </p>
      )}
    </div>
  )
}
