import { GOOGLE_REVIEW_PLACE_ID } from "./company"

export type GoogleRating = { rating: number; reviewCount: number; mapsUrl: string }

/** Live star rating and review count for this business's Google profile, so the hero and the
 *  reviews section always quote the same figure. Returns null when the Place ID or server key is
 *  missing or the request fails — callers then link to the reviews without quoting a number. */
export async function getGoogleRating(): Promise<GoogleRating | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim()
  if (!GOOGLE_REVIEW_PLACE_ID || !apiKey) return null

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(GOOGLE_REVIEW_PLACE_ID)}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri" },
      next: { revalidate: 60 * 60 * 6 },
    })
    if (!res.ok) {
      console.error("Google rating request failed. Check Places API (New) is enabled for GOOGLE_MAPS_SERVER_API_KEY.", res.status)
      return null
    }
    const place = (await res.json()) as { rating?: number; userRatingCount?: number; googleMapsUri?: string }
    if (!place.rating || !place.userRatingCount) return null
    return {
      rating: place.rating,
      reviewCount: place.userRatingCount,
      mapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(GOOGLE_REVIEW_PLACE_ID)}`,
    }
  } catch (error) {
    console.error("Google rating request failed.", error)
    return null
  }
}
