import { ExternalLink, MapPin, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createGoogleMapsUrl, type AirportMapLocation } from "@/lib/google-maps-links"

// One clear action: at the airport, "Open in Google Maps" is the button people need. The map
// visual is decorative, so no Maps request runs on page load.
export function AirportMapPreview({ location }: { location: AirportMapLocation }) {
  const mapsUrl = createGoogleMapsUrl(location)
  const placeName = location.address.split(",")[0]

  return (
    <div className="airport-map-card">
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
          <p className="airport-map-title">Airport location</p>
          <p className="airport-map-address"><MapPin aria-hidden="true" />{location.address}</p>
        </div>
        <Button size="lg" nativeButton={false} render={<a href={mapsUrl} rel="noreferrer" target="_blank" />}>
          Open in Google Maps <ExternalLink aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
