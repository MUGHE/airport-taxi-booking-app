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

export function formatTimeLabel(value: string) {
  const [h, m] = value.split(":").map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function formatDate(value: string) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : ""
}
