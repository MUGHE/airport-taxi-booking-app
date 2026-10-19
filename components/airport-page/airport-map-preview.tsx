"use client"

import { useState } from "react"
import { ExternalLink, MapPin, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createGoogleMapsUrl, type AirportMapLocation } from "@/lib/google-maps-links"

export type MapTerminal = { id: string; label: string; latitude: number; longitude: number }

// One clear action: at the airport, "Open in Google Maps" is the button people need. Airports with
// several terminals get a tab per terminal, and the button follows the selected one. The map visual
// is decorative, so no Maps request runs on page load.
export function AirportMapPreview({ location, terminals = [] }: { location: AirportMapLocation; terminals?: MapTerminal[] }) {
  const [selectedId, setSelectedId] = useState(terminals[0]?.id)
  const selected = terminals.find((terminal) => terminal.id === selectedId)
  const mapsUrl = selected
    ? createGoogleMapsUrl({ ...location, placeId: undefined, latitude: selected.latitude, longitude: selected.longitude })
    : createGoogleMapsUrl(location)
  const placeName = selected?.label ?? location.address.split(",")[0]

  return (
    <div className="airport-map-card">
      {terminals.length > 0 && (
        <div className="airport-map-tabs" role="tablist" aria-label="Choose your terminal">
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              id={`terminal-${terminal.label.toLowerCase().replace(/^terminal\s+/, "").replace(/\s+/g, "-")}`}
              type="button"
              role="tab"
              aria-selected={terminal.id === selectedId}
              className="airport-map-tab"
              onClick={() => setSelectedId(terminal.id)}
            >
              {terminal.label.replace(/^Terminal\s+/i, "T")}
            </button>
          ))}
        </div>
      )}
      <div className="airport-map-visual" aria-hidden="true">
        <span className="airport-map-road airport-map-road-a" />
        <span className="airport-map-road airport-map-road-b" />
        <span className="airport-map-road airport-map-road-c" />
        <div className="airport-map-pin">
          <span className="airport-map-pulse" />
          <span className="airport-map-pin-icon"><Plane /></span>
          <span className="airport-map-pin-label">{placeName}</span>
        </div>
      </div>
      <div className="airport-map-card-footer">
        <div>
          <p className="airport-map-title">{selected ? "Your terminal on the map" : "Airport location"}</p>
          <p className="airport-map-address"><MapPin aria-hidden="true" />{selected ? `${selected.label}, ${location.address}` : location.address}</p>
        </div>
        <Button size="lg" nativeButton={false} render={<a href={mapsUrl} rel="noreferrer" target="_blank" />}>
          {selected ? `Open ${selected.label} in Google Maps` : "Open in Google Maps"} <ExternalLink aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
