"use client"

import { useEffect, useState } from "react"

export interface PlaceSelection {
  placeId: string
  address: string
  lat: number
  lng: number
}

export type PlaceSuggestion = {
  id: string
  main: string
  secondary: string
  prediction: any
}

export type PlacesLibrary = {
  AutocompleteSuggestion: any
  AutocompleteSessionToken: any
}

let mapsPromise: Promise<void> | null = null

export function loadGoogleMaps(apiKey: string): Promise<void> {
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

    // Another mount may already have injected the tag. Waiting on the API itself (rather than
    // returning here) is what keeps this promise from hanging forever in that case.
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')

    if (existingScript) {
      const started = Date.now()
      const poll = window.setInterval(() => {
        if ((window as any).google?.maps?.importLibrary) {
          window.clearInterval(poll)
          resolve()
        } else if (Date.now() - started > 15000) {
          window.clearInterval(poll)
          mapsPromise = null
          reject(new Error("Google Maps JavaScript API did not finish loading"))
        }
      }, 50)
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
// sometimes as an object with a `.text` field.
function textOf(value: any): string {
  if (typeof value === "string") return value
  return value?.text ?? ""
}

/** Loads the Places library once per page and reports why it could not load, if it could not. */
export function usePlacesLibrary(): { library: PlacesLibrary | null; error: string } {
  const [library, setLibrary] = useState<PlacesLibrary | null>(null)
  const [error, setError] = useState("")

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
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await (window as any).google.maps.importLibrary(
          "places"
        )
        if (cancelled) return
        setLibrary({ AutocompleteSuggestion, AutocompleteSessionToken })
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

  return { library, error }
}

export async function fetchPlaceSuggestions(
  library: PlacesLibrary,
  input: string,
  sessionToken: any
): Promise<PlaceSuggestion[]> {
  const response = await library.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    sessionToken,
    includedRegionCodes: ["gb"],
  })

  return (response?.suggestions ?? [])
    .map((suggestion: any) => suggestion.placePrediction)
    .filter(Boolean)
    .map((prediction: any) => ({
      id: prediction.placeId ?? textOf(prediction.text),
      main: textOf(prediction.mainText) || textOf(prediction.text),
      secondary: textOf(prediction.secondaryText),
      prediction,
    }))
}

/** Turns a suggestion into the coordinates the rest of the booking flow needs. */
export async function resolvePlace(suggestion: PlaceSuggestion): Promise<PlaceSelection | null> {
  try {
    const place = suggestion.prediction.toPlace()
    await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] })

    if (!place.location) {
      console.warn("Selected Google Place does not contain a location.", place)
      return null
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

    return {
      placeId: place.id ?? "",
      address,
      lat: place.location.lat(),
      lng: place.location.lng(),
    }
  } catch (selectionError) {
    console.error("Google Maps place selection failed:", selectionError)
    return null
  }
}
