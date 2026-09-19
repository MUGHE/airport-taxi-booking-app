"use client"

import { useEffect, useRef, useState } from "react"
import { loadGoogleMaps } from "@/lib/places"

const LONDON = { lat: 51.5074, lng: -0.1278 }

/**
 * Draw-on-map polygon editor. Click the map to add corners, drag a corner (or the midpoint
 * between two) to reshape, right-click a corner to remove it.
 */
export function ZoneMapEditor({ zone, onChange }: { zone: [number, number][]; onChange: (zone: [number, number][]) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const polygonRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [error, setError] = useState("")

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) { setError("Google Maps key is not configured."); return }
    let cancelled = false

    async function init() {
      try {
        await loadGoogleMaps(apiKey!)
        if (cancelled || !hostRef.current) return
        const g = (window as any).google
        const { Map } = await g.maps.importLibrary("maps")

        const map = new Map(hostRef.current, { center: LONDON, zoom: 11, disableDefaultUI: true, zoomControl: true })
        const polygon = new g.maps.Polygon({
          map, editable: true, draggable: false,
          paths: zone.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: "#2563eb", strokeWeight: 2, fillColor: "#2563eb", fillOpacity: 0.15,
        })
        polygonRef.current = polygon
        const path = polygon.getPath()
        const emit = () => onChangeRef.current(path.getArray().map((p: any) => [p.lat(), p.lng()] as [number, number]))

        for (const evt of ["insert_at", "set_at", "remove_at"]) path.addListener(evt, emit)
        map.addListener("click", (e: any) => { path.push(e.latLng) })
        polygon.addListener("rightclick", (e: any) => { if (e.vertex != null) path.removeAt(e.vertex) })

        if (zone.length) {
          const bounds = new g.maps.LatLngBounds()
          zone.forEach(([lat, lng]) => bounds.extend({ lat, lng }))
          map.fitBounds(bounds, 32)
        }
      } catch (err) {
        console.error("Zone editor failed to load:", err)
        if (!cancelled) setError("Couldn't load the map.")
      }
    }

    init()
    return () => { cancelled = true }
    // Initial zone only — edits flow out through onChange, never back in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // "Clear" from the parent: empty zone prop while the polygon still has points.
  useEffect(() => {
    const path = polygonRef.current?.getPath()
    if (zone.length === 0 && path?.getLength()) path.clear()
  }, [zone])

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div ref={hostRef} className="h-80 w-full bg-secondary" />
      {error && <div className="absolute inset-0 flex items-center justify-center bg-secondary px-4 text-center text-sm text-muted-foreground">{error}</div>}
    </div>
  )
}
