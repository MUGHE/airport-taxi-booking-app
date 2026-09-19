"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZoneMapEditor } from "@/components/admin/zone-map-editor"
import { updateCongestionPricingAction } from "@/lib/actions"
import type { CongestionPricing } from "@/lib/types"
import { toast } from "sonner"

export function CongestionPricingPanel({ pricing }: { pricing: CongestionPricing }) {
  const router = useRouter()
  const [fee, setFee] = useState(String(pricing.fee))
  const [zone, setZone] = useState(pricing.zone)
  const [isPending, startTransition] = useTransition()

  const dirty = Number(fee) !== pricing.fee || JSON.stringify(zone) !== JSON.stringify(pricing.zone)

  function save() {
    const value = Number(fee)
    if (!Number.isFinite(value) || value < 0) return toast.error("Enter a valid congestion fee.")
    if (zone.length < 3) return toast.error("Click at least three points on the map to outline the zone.")
    startTransition(async () => {
      const result = await updateCongestionPricingAction(value, zone)
      if (!result.ok) { toast.error(result.error || "Could not update the congestion charge."); return }
      toast.success(`Congestion charge is now £${value}.`)
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Congestion charge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Added once to any trip whose pickup, drop-off, or stop falls inside the zone.
          Click the map to add corners, drag a corner or edge midpoint to reshape, right-click a corner to remove it.
        </p>
      </div>
      <div className="space-y-4">
        <div className="w-32">
          <Label>Fee (£)</Label>
          <Input type="number" min="0" step="0.5" value={fee} onChange={(e) => setFee(e.target.value)} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>Zone boundary <span className="font-normal text-muted-foreground">({zone.length} corner{zone.length === 1 ? "" : "s"})</span></Label>
            <Button type="button" variant="ghost" size="sm" disabled={zone.length === 0} onClick={() => setZone([])}><Trash2 className="size-4" />Clear</Button>
          </div>
          <ZoneMapEditor zone={zone} onChange={setZone} />
        </div>
        <Button disabled={isPending || !dirty} onClick={save}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </div>
    </section>
  )
}
