"use client"

import { useState } from "react"
import { ExternalLink, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createGoogleMapsEmbedUrl, createGoogleMapsUrl, type AirportMapLocation } from "@/lib/google-maps-links"

export function AirportMapPreview({ location }: { location: AirportMapLocation }) {
  const [showInteractiveMap, setShowInteractiveMap] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapsUrl = createGoogleMapsUrl(location)

  if (showInteractiveMap && apiKey) {
    return (
      <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-secondary">
        <iframe
          allowFullScreen
          className="h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={createGoogleMapsEmbedUrl(location, apiKey)}
          title={`Google map of ${location.address}`}
        />
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{location.address}</p>
          <a className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href={mapsUrl} rel="noreferrer" target="_blank">Open in Google Maps <ExternalLink className="size-4" /></a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border border-border/70 bg-secondary p-5">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><MapPin className="size-5" /></span>
          <div><p className="font-medium">Airport location</p><p className="mt-1 text-sm text-muted-foreground">{location.address}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowInteractiveMap(true)}>View interactive map</Button>
          <Button variant="outline" nativeButton={false} render={<a href={mapsUrl} rel="noreferrer" target="_blank" />}>Open in Google Maps</Button>
        </div>
      </div>
      {showInteractiveMap && !apiKey && <p className="relative mt-4 text-sm text-muted-foreground">The map preview could not load. Use “Open in Google Maps” instead.</p>}
    </div>
  )
}
