import { Skeleton } from "@/components/ui/skeleton"

function LoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading page" className="space-y-6">
      <span className="sr-only">Loading page…</span>
      {children}
    </div>
  )
}

export function AdminPageLoading() {
  return (
    <LoadingShell>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </LoadingShell>
  )
}

export function DestinationPagesLoading() {
  return (
    <LoadingShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-[28rem] w-full rounded-xl" />
    </LoadingShell>
  )
}

export function DestinationPageEditorLoading() {
  return (
    <LoadingShell>
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-[32rem] w-full rounded-xl" />
    </LoadingShell>
  )
}
