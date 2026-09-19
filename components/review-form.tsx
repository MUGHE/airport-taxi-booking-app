"use client"

import { useState, useTransition } from "react"
import { Star, ExternalLink, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitReviewAction } from "@/lib/actions"

export function ReviewForm({ reference, customerName }: { reference: string; customerName: string }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ googleReviewUrl: string | null } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Please choose a star rating first.")
      return
    }
    startTransition(async () => {
      const res = await submitReviewAction(reference, rating, comment)
      if (!res.ok) {
        toast.error(res.error || "Something went wrong. Please try again.")
        return
      }
      setResult({ googleReviewUrl: res.googleReviewUrl ?? null })
    })
  }

  if (result) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Thank you!</h2>
        {result.googleReviewUrl ? (
          <>
            <p className="mt-2 text-muted-foreground">
              We're glad you had a great ride. Mind sharing that on Google too? It really helps us out.
            </p>
            <Button className="mt-4" nativeButton={false} render={<a href={result.googleReviewUrl} target="_blank" rel="noopener noreferrer" />}>
              Leave a Google review
              <ExternalLink className="size-4" />
            </Button>
          </>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Thanks for letting us know. Our team will review your feedback and follow up if needed.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">Hi {customerName}, how was your ride?</p>

      <div className="mt-4 flex justify-center gap-1" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={`size-9 transition-colors ${
                star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us more about your trip (optional)"
        className="mt-4"
        rows={4}
        maxLength={2000}
      />

      <Button type="submit" className="mt-4 w-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Submit review
      </Button>
    </form>
  )
}
