"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSitePromotionAction } from "@/lib/actions"
import type { SitePromotion } from "@/lib/types"
import { toast } from "sonner"

export function SitePromotionPanel({ promotion }: { promotion: SitePromotion }) {
  const router = useRouter()
  const [discountPercent, setDiscountPercent] = useState(String(promotion.discountPercent))
  const [isPending, startTransition] = useTransition()

  function save(active: boolean) {
    const value = Number(discountPercent)
    if (!Number.isFinite(value) || value <= 0 || value > 100) return toast.error("Enter a discount percentage between 1 and 100.")
    startTransition(async () => {
      const result = await updateSitePromotionAction(active, value)
      if (!result.ok) { toast.error(result.error || "Could not update the promotion."); return }
      toast.success(active ? `${value}% off is now live for every customer.` : "Promotion turned off.")
      router.refresh()
    })
  }

  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">Site-wide promotion</h2>
        <p className="mt-1 text-sm text-muted-foreground">Applies automatically to every fare — no code needed. Customers see the original and discounted price side by side.</p>
      </div>
      {promotion.active && <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Live · {promotion.discountPercent}% off</span>}
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-32">
        <Label>Discount %</Label>
        <Input type="number" min="1" max="100" step="1" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
      </div>
      {promotion.active ? (
        <Button variant="outline" disabled={isPending} onClick={() => save(false)}>Turn off promotion</Button>
      ) : (
        <Button disabled={isPending} onClick={() => save(true)}>Activate promotion</Button>
      )}
    </div>
  </section>
}
