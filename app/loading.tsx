import { ProgressRing } from "@/components/progress-ring"

// Next's App Router shows this automatically while a route segment is loading/streaming.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <ProgressRing size={44} className="text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Loading…</p>
    </div>
  )
}
