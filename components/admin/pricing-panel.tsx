"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/fleet"
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
          vehicle class.
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
  const [isPending, startTransition] = useTransition()

  const dirty =
    Number(minFare) !== vehicle.minFare ||
    Number(perMileAfter) !== vehicle.perMileAfter ||
    Number(perMinuteRate) !== vehicle.perMinuteRate

  function save() {
    const minFareNum = Number(minFare)
    const perMileNum = Number(perMileAfter)
    const perMinuteNum = Number(perMinuteRate)
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
    startTransition(async () => {
      const res = await updateVehiclePricing(vehicle.id, minFareNum, perMileNum, perMinuteNum)
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
          <Label className="text-xs text-muted-foreground">Per mile after 10mi (£)</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={perMileAfter}
            onChange={(e) => setPerMileAfter(e.target.value)}
          />
        </div>
      </div>
      <Button size="sm" className="mt-3" onClick={save} disabled={isPending || !dirty}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save
      </Button>
    </div>
  )
}
