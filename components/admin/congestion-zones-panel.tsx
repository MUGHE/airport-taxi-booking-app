"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZoneMapEditor } from "@/components/admin/zone-map-editor"
import { deleteCongestionZoneAction, upsertCongestionZoneAction } from "@/lib/actions"
import type { CongestionZone } from "@/lib/types"
import { toast } from "sonner"

const EMPTY = { name: "", fee: "", zone: [] as [number, number][] }

export function CongestionZonesPanel({ zones }: { zones: CongestionZone[] }) {
  const router = useRouter()
  const [editingName, setEditingName] = useState<string | null>(null) // null = adding a new zone
  const [form, setForm] = useState(EMPTY)
  const [isPending, startTransition] = useTransition()

  function startEdit(z: CongestionZone) {
    setEditingName(z.name)
    setForm({ name: z.name, fee: String(z.fee), zone: z.zone })
  }
  function startNew() {
    setEditingName(null)
    setForm(EMPTY)
  }

  function save() {
    const fee = Number(form.fee)
    if (!form.name.trim()) return toast.error("Enter a zone name.")
    if (!Number.isFinite(fee)) return toast.error("Enter a valid fee — negative for a discount, positive for a surcharge.")
    if (form.zone.length < 3) return toast.error("Click at least three points on the map to outline the zone.")
    startTransition(async () => {
      const result = await upsertCongestionZoneAction(form.name, fee, form.zone)
      if (!result.ok) { toast.error(result.error || "Could not save the zone."); return }
      toast.success(`${form.name} saved.`)
      startNew()
      router.refresh()
    })
  }

  function remove(name: string) {
    if (!window.confirm(`Delete the "${name}" zone? This can't be undone.`)) return
    startTransition(async () => {
      const result = await deleteCongestionZoneAction(name)
      if (!result.ok) { toast.error(result.error || "Could not delete the zone."); return }
      toast.success(`${name} deleted.`)
      if (editingName === name) startNew()
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Congestion zones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A trip is charged the sum of every zone its pickup, drop-off, or a stop falls inside —
          use a negative fee for a discount zone (e.g. around the office), positive for a surcharge.
        </p>
      </div>

      <div className="space-y-2">
        {zones.length === 0 ? <p className="text-sm text-muted-foreground">No zones yet.</p> : zones.map((z) => (
          <div key={z.name} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span className="font-medium">{z.name}</span>
            <div className="flex items-center gap-3">
              <span className={z.fee < 0 ? "font-medium text-emerald-600" : "font-medium"}>
                {z.fee >= 0 ? "+" : ""}£{z.fee}
              </span>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => startEdit(z)}><Pencil className="size-3.5" />Edit</Button>
              <Button size="sm" variant="destructive" disabled={isPending} onClick={() => remove(z.name)}><Trash2 className="size-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{editingName ? `Editing "${editingName}"` : "Add a zone"}</p>
          {editingName && <Button type="button" variant="ghost" size="sm" onClick={startNew}><X className="size-3.5" />Cancel</Button>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label>Zone name</Label>
            {/* Locked while editing — the name is the row's key, so changing it here would
                upsert a second row instead of renaming this one. Delete + re-add to rename. */}
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={editingName !== null} placeholder="e.g. Slough Office" />
          </div>
          <div className="w-32">
            <Label>Fee (£)</Label>
            <Input type="number" step="0.5" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="-5 or 18" />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>Zone boundary <span className="font-normal text-muted-foreground">({form.zone.length} corner{form.zone.length === 1 ? "" : "s"})</span></Label>
            <Button type="button" variant="ghost" size="sm" disabled={form.zone.length === 0} onClick={() => setForm((f) => ({ ...f, zone: [] }))}><Trash2 className="size-4" />Clear</Button>
          </div>
          {/* Keyed on what's being edited: the editor only reads `zone` on mount, so switching
              zones (or back to "Add") remounts it with that zone's shape instead of the last one. */}
          <ZoneMapEditor key={editingName ?? "new"} zone={form.zone} onChange={(zone) => setForm((f) => ({ ...f, zone }))} />
        </div>
        <Button disabled={isPending} onClick={save}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {editingName ? "Save changes" : "Add zone"}
        </Button>
      </div>
    </section>
  )
}
