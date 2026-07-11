import type { BookingStatus } from "./types"

export const STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "assigned",
  "completed",
  "cancelled",
]

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending payment",
  confirmed: "Confirmed",
  assigned: "Driver assigned",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  confirmed: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  assigned: "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  cancelled: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
}
