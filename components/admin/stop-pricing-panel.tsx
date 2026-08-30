"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStopPricingAction } from "@/lib/actions"
import type { StopPricing } from "@/lib/types"
import { toast } from "sonner"

export function StopPricingPanel({ pricing }: { pricing: StopPricing }) {
  const router = useRouter()
  const [pricePerStop, setPricePerStop] = useState(String(pricing.pricePerStop))
  const [isPending, startTransition] = useTransition()

  const dirty = Number(pricePerStop) !== pricing.pricePerStop

  function save() {
    const value = Number(pricePerStop)
    if (!Number.isFinite(value) || value < 0) return toast.error("Enter a valid price per stop.")
    startTransition(async () => {
      const result = await updateStopPricingAction(value)
      if (!result.ok) { toast.error(result.error || "Could not update the stop fee."); return }
      toast.success(`Extra stops now cost £${value} each.`)
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Extra stops</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers can add up to 3 stops between pickup and drop-off during booking.
          Each stop adds this flat fee to the fare.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Label>Price per stop (£)</Label>
          <Input type="number" min="0" step="0.5" value={pricePerStop} onChange={(e) => setPricePerStop(e.target.value)} />
        </div>
        <Button disabled={isPending || !dirty} onClick={save}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </div>
    </section>
  )
}
