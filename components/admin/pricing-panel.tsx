"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, MIN_DISTANCE_MILES } from "@/lib/fleet"
import { updateVehiclePricing } from "@/lib/actions"
import type { VehicleClass } from "@/lib/types"
import { toast } from "sonner"

function formatRate(value: number): string {
  return `£${value.toFixed(2)}`
}

export function PricingPanel({ vehicles }: { vehicles: VehicleClass[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Vehicle pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the minimum fare, distance rate, and driving-time rate for each
          vehicle class. The deadhead rate is charged on top of the per-mile rate,
          for long-haul miles only — leave it at £0 to switch it off.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {vehicles.map((v) => (
          <VehicleRateRow key={v.id} vehicle={v} />
        ))}
      </div>
    </div>
  )
}

function VehicleRateRow({ vehicle }: { vehicle: VehicleClass }) {
  const router = useRouter()
  const [minFare, setMinFare] = useState(String(vehicle.minFare))
  const [perMileAfter, setPerMileAfter] = useState(String(vehicle.perMileAfter))
  const [perMinuteRate, setPerMinuteRate] = useState(String(vehicle.perMinuteRate))
  const [threshold, setThreshold] = useState(String(vehicle.longDistanceThresholdMiles))
  const [deadheadPerMile, setDeadheadPerMile] = useState(String(vehicle.deadheadPerMile))
  const [isPending, startTransition] = useTransition()

  const minFareNum = Number(minFare)
  const perMileNum = Number(perMileAfter)
  const perMinuteNum = Number(perMinuteRate)
  const thresholdNum = Number(threshold)
  const deadheadNum = Number(deadheadPerMile)

  const dirty =
    Number(minFare) !== vehicle.minFare ||
    Number(perMileAfter) !== vehicle.perMileAfter ||
    Number(perMinuteRate) !== vehicle.perMinuteRate ||
    Number(threshold) !== vehicle.longDistanceThresholdMiles ||
    Number(deadheadPerMile) !== vehicle.deadheadPerMile

  function save() {
    if (!Number.isFinite(minFareNum) || minFareNum < 0) {
      toast.error("Enter a valid minimum fare.")
      return
    }
    if (!Number.isFinite(perMileNum) || perMileNum < 0) {
      toast.error("Enter a valid per-mile rate.")
      return
    }
    if (!Number.isFinite(perMinuteNum) || perMinuteNum < 0) {
      toast.error("Enter a valid per-minute rate.")
      return
    }
    if (!Number.isFinite(thresholdNum) || thresholdNum < MIN_DISTANCE_MILES) {
      toast.error(`Long-distance threshold must be at least ${MIN_DISTANCE_MILES} miles.`)
      return
    }
    if (!Number.isFinite(deadheadNum) || deadheadNum < 0) {
      toast.error("Enter a valid deadhead rate.")
      return
    }
    startTransition(async () => {
      const res = await updateVehiclePricing(vehicle.id, minFareNum, perMileNum, perMinuteNum, thresholdNum, deadheadNum)
      if (res.ok) {
        toast.success(`${vehicle.name} pricing updated.`)
        router.refresh()
      } else {
        toast.error(res.error || "Could not update pricing.")
      }
    })
  }

  return (
    <div className="rounded-xl border border-border/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{vehicle.name}</h3>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(vehicle.minFare)} min · {formatRate(vehicle.perMileAfter)}/mi · {formatRate(vehicle.perMinuteRate)}/min
          {vehicle.deadheadPerMile > 0 && ` · +${formatRate(vehicle.deadheadPerMile)}/mi over ${vehicle.longDistanceThresholdMiles}mi`}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Min fare (£, first 10mi)</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={minFare}
            onChange={(e) => setMinFare(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Per driving minute (£)</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={perMinuteRate}
            onChange={(e) => setPerMinuteRate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Per mile after {MIN_DISTANCE_MILES}mi (£)</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={perMileAfter}
            onChange={(e) => setPerMileAfter(e.target.value)}
          />
        </div>
      </div>

      {/* Kept as its own block: these two only make sense as a pair, and the effective
          long-haul rate below spells out that the deadhead rate stacks on the base one. */}
      <div className="mt-3 rounded-lg border border-border/70 bg-secondary/40 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-xs font-medium">Deadhead compensation</span>
          <span className="text-xs text-muted-foreground">
            {!Number.isFinite(deadheadNum) || !Number.isFinite(perMileNum) || !Number.isFinite(thresholdNum)
              ? "—"
              : deadheadNum > 0
                ? `${formatRate(perMileNum + deadheadNum)}/mi over ${thresholdNum}mi`
                : "Off — set a rate to enable"}
          </span>
        </div>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Long-distance from (mi)</Label>
            <Input
              type="number"
              min={MIN_DISTANCE_MILES}
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Deadhead per mile (£)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={deadheadPerMile}
              onChange={(e) => setDeadheadPerMile(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button size="sm" className="mt-3" onClick={save} disabled={isPending || !dirty}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save
      </Button>
    </div>
  )
}
