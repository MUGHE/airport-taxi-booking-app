import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ReviewForm } from "@/components/review-form"
import { getReviewPageDataAction } from "@/lib/actions"

export function generateMetadata(): Metadata {
  return {
    title: "Rate Your Ride",
    description: "Tell us how your ONE Airport Taxi ride went.",
    robots: { index: false, follow: false },
  }
}

export default async function ReviewPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const data = await getReviewPageDataAction(reference)
  if (!data) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">Rate your ride</h1>
        {data.alreadySubmitted ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="size-6" />
            </span>
            <p className="mt-4 text-muted-foreground">You've already shared your feedback for this trip. Thank you!</p>
          </div>
        ) : (
          <ReviewForm reference={reference} customerName={data.customerName} />
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
