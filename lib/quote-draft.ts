// The trip a visitor last entered (homepage quote form or /book's Trip step), kept in
// sessionStorage so going back to the homepage shows the same route instead of an empty form.
import type { PlaceSelection } from "@/components/destination-picker"

const KEY = "quote-draft:v1"

export type QuoteDraft = {
  pickup: PlaceSelection | null
  dropoff: PlaceSelection | null
  stops: PlaceSelection[]
  pickupDate: string
  pickupTime: string
}

const isPlace = (value: unknown): value is PlaceSelection => {
  const p = value as PlaceSelection | null
  return !!p && typeof p.address === "string" && p.address !== "" && Number.isFinite(p.lat) && Number.isFinite(p.lng)
}

export function saveQuoteDraft(draft: QuoteDraft) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...draft, stops: draft.stops.filter(isPlace) }))
  } catch {
    // Storage can be unavailable (private mode, quota); the form just won't be restored.
  }
}

export function clearQuoteDraft() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {}
}

/** The saved draft, or null if there is none. A date that has since passed is dropped with its time. */
export function readQuoteDraft(today: string): QuoteDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<QuoteDraft>
    const dateValid = typeof data.pickupDate === "string" && data.pickupDate >= today
    return {
      pickup: isPlace(data.pickup) ? data.pickup : null,
      dropoff: isPlace(data.dropoff) ? data.dropoff : null,
      stops: Array.isArray(data.stops) ? data.stops.filter(isPlace) : [],
      pickupDate: dateValid ? data.pickupDate! : "",
      pickupTime: dateValid && typeof data.pickupTime === "string" ? data.pickupTime : "",
    }
  } catch {
    return null
  }
}

/** "38 mins", "1 hr", "1 hr 12 mins". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours} hr${rest ? ` ${rest} min${rest === 1 ? "" : "s"}` : ""}`
}

/** "16.4 miles". */
export function formatMiles(miles: number): string {
  return `${miles.toFixed(1)} miles`
}
