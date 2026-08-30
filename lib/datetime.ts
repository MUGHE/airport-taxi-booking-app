// Shared pickup date/time helpers for the fare estimator (components/fare-estimator.tsx)
// and the booking flow (components/booking/booking-flow.tsx), so both use the same
// custom date picker and 15-minute time slots instead of native browser widgets.

// Local calendar date/time as "YYYY-MM-DD" / "HH:MM" — deliberately NOT toISOString(),
// which converts to UTC and can be a day off from the device's actual local date.
export function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
export function localTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// Fixed 15-minute time slots (custom-rendered, not a native picker) so pickup time selection
// behaves identically on every device instead of depending on the OS's own time-wheel widget.
export const TIME_SLOTS = Array.from(
  { length: 24 * 4 },
  (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
)

// No mandatory notice period before a same-day pickup — the earliest slot is just "now",
// rounded up to line up with the 15-minute grid. Kept as a constant (rather than inlining 0)
// so a lead time can be reintroduced later without touching the callers below.
export const BOOKING_LEAD_MINUTES = 0

/**
 * Earliest pickup time selectable when the pickup date is today: "now" (plus the lead-time
 * buffer, if any), rounded up to the next 15-minute slot (e.g. 6:07 PM -> 6:15 PM). If the
 * buffer pushes past midnight, returns a value past every slot in TIME_SLOTS so none qualify —
 * the customer has to pick a later date instead.
 */
export function minPickupTimeToday(referenceDate: Date = new Date()): string {
  const withLead = new Date(referenceDate.getTime() + BOOKING_LEAD_MINUTES * 60_000)
  const remainder = withLead.getMinutes() % 15
  if (remainder !== 0) withLead.setMinutes(withLead.getMinutes() + (15 - remainder))
  withLead.setSeconds(0, 0)
  const rolledToNextDay =
    withLead.getFullYear() !== referenceDate.getFullYear() ||
    withLead.getMonth() !== referenceDate.getMonth() ||
    withLead.getDate() !== referenceDate.getDate()
  return rolledToNextDay ? "24:00" : localTime(withLead)
}

export function formatTimeLabel(value: string) {
  const [h, m] = value.split(":").map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function formatDate(value: string) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : ""
}
