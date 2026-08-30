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

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    )

    if (existingScript) {
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
      console.error(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured."
      )

      setError("Google Maps is not configured.")
      return
    }

    if (!hostRef.current) {
      return
    }

    let cancelled = false

    let autocomplete: HTMLElement | null = null

    let handleInput: (() => void) | undefined

    let handleSelect:
      | ((event: Event) => Promise<void>)
      | undefined

    let selectionInProgress = false

    let selectionResetTimer:
      | ReturnType<typeof setTimeout>
      | undefined

    const initializeAutocomplete = async () => {
      try {
        /*Load the Google Maps JavaScript API.*/
        await loadGoogleMaps(apiKey)

        if (cancelled) {
          return
        }

        /*Load the Places library.*/
        const { PlaceAutocompleteElement } =
          await (window as any).google.maps.importLibrary("places")

        if (cancelled || !hostRef.current) {
          return
        }

        /*Create the Google Places Autocomplete element.*/
        const element = new PlaceAutocompleteElement() as HTMLElement

        /*Configure the element.*/
        ;(element as any).placeholder = placeholder
        ;(element as any).value = defaultValue
	;(element as any).noInputIcon = true
        // Restrict autocomplete suggestions to the UK so a keyword doesn't match
        // addresses/places anywhere in the world.
        ;(element as any).includedRegionCodes = ["gb"]

        element.style.width = "100%"
        element.style.maxWidth = "100%"
        element.style.height = "100%"
        element.style.borderRadius = "var(--radius-lg)"
        element.style.border = "1px solid var(--input)"
        element.style.backgroundColor = "transparent"
        element.style.boxSizing = "border-box"

        /* Handle normal input.
         * Google may emit an input event after gmp-select.
         * Avoid clearing the selected location in that case.
         */
        handleInput = () => {
          if (selectionInProgress) {
            return
          }

          onClearRef.current?.()
        }

        /* Handle place selection.*/
        handleSelect = async (event: Event) => {
          selectionInProgress = true

          if (selectionResetTimer) {
            clearTimeout(selectionResetTimer)
          }

          selectionResetTimer = setTimeout(() => {
            selectionInProgress = false
          }, 100)

          try {
            const placePrediction =
              (event as any).placePrediction ??
              (event as CustomEvent).detail?.placePrediction

            if (!placePrediction) {
              console.warn(
                "Google Maps gmp-select event did not contain a placePrediction.",
                event
              )

              return
            }

            /*
             * Convert the prediction into a Place object.
             */
            const place = placePrediction.toPlace()

            /*
             * Request only the fields we actually need.
             */
            await place.fetchFields({
              fields: [
                "id",
                "displayName",
                "formattedAddress",
                "location",
              ],
            })

            if (cancelled) {
              return
            }

            if (!place.location) {
              console.warn(
                "Selected Google Place does not contain a location.",
                place
              )

              return
            }

            // Google can return a broad formatted address for stations and
            // landmarks (for example, "Hounslow, UK"). Preserve the place's
            // display name so customers can recognise their exact selection.
            const displayName =
              typeof place.displayName === "string"
                ? place.displayName
                : place.displayName?.text ?? ""
            const formattedAddress = place.formattedAddress ?? ""
            const address =
              displayName &&
              formattedAddress &&
              !formattedAddress.toLocaleLowerCase().includes(displayName.toLocaleLowerCase())
                ? `${displayName}, ${formattedAddress}`
                : displayName || formattedAddress

            const selection: PlaceSelection = {
              placeId: place.id ?? "",
              address,
              lat: place.location.lat(),
              lng: place.location.lng(),
            }

            onSelectRef.current(selection)
          } catch (selectionError) {
            console.error(
              "Google Maps place selection failed:",
              selectionError
            )
          }
        }

        /* Register event listeners.*/
        element.addEventListener("input", handleInput)
        element.addEventListener("gmp-select", handleSelect)

        autocomplete = element

        /*Insert the Google element into our container.*/
        hostRef.current.replaceChildren(element)

        if (!cancelled) {
          setReady(true)
          setError("")
        }
      } catch (initializationError) {
        console.error(
          "Google Maps Places initialization failed:",
          initializationError
        )

        if (!cancelled) {
          setReady(false)
          setError("Google Maps suggestions could not be loaded.")
        }
      }
    }

    initializeAutocomplete()

    return () => {
      cancelled = true

      if (selectionResetTimer) {
        clearTimeout(selectionResetTimer)
      }

      if (autocomplete && handleInput) {
        autocomplete.removeEventListener(
          "input",
          handleInput
        )
      }

      if (autocomplete && handleSelect) {
        autocomplete.removeEventListener(
          "gmp-select",
          handleSelect
        )
      }

      if (
        hostRef.current &&
        autocomplete &&
        hostRef.current.contains(autocomplete)
      ) {
        hostRef.current.removeChild(autocomplete)
      }

      autocomplete = null
    }
  }, [defaultValue, placeholder])

  return (
    <div className="min-w-0">
      <div className="relative min-w-0 rounded-lg">
        {/*
         * Our own location icon.
         *
         * This replaces the previous "input-icon" slot manipulation.
         */}
        <MapPin
          className="
            pointer-events-none
            absolute
            left-2.5
            top-1/2
            z-10
            size-4
            -translate-y-1/2
            text-muted-foreground
          "
        />

        <div
          ref={hostRef}
          className="
            h-8
            min-w-0
            [&>gmp-place-autocomplete]:block
            [&>gmp-place-autocomplete]:h-full
            [&>gmp-place-autocomplete]:max-w-full
            [&>gmp-place-autocomplete]:w-full
          "
        />

        {!ready && !error && (
          <Loader2
            className="
              absolute
              right-2.5
              top-1/2
              size-4
              -translate-y-1/2
              animate-spin
              text-muted-foreground
            "
          />
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
