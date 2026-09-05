"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteBookingAddOnAction, upsertBookingAddOn } from "@/lib/actions"
import { formatCurrency } from "@/lib/fleet"
import type { BookingAddOn } from "@/lib/types"
import { toast } from "sonner"

type AddOn = BookingAddOn & { active: boolean }

export function AddOnsPanel({ addOns }: { addOns: AddOn[] }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [deleting, setDeleting] = useState<AddOn | null>(null)
  const [isPending, startTransition] = useTransition()
  function add() {
    const amount = Number(price)
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) return toast.error("Enter an add-on name and a valid price.")
    startTransition(async () => {
      const result = await upsertBookingAddOn({ name, price: amount, active: true })
      if (!result.ok) {
        toast.error(result.error || "Could not add the add-on.")
        return
      }
      setName("")
      setPrice("")
      toast.success("Add-on added.")
      router.refresh()
    })
  }
  function toggle(addOn: AddOn) {
    startTransition(async () => {
      const result = await upsertBookingAddOn({ ...addOn, active: !addOn.active })
      if (!result.ok) { toast.error(result.error || "Could not update the add-on."); return }
      toast.success(`${addOn.name} ${addOn.active ? "disabled" : "enabled"}.`)
      router.refresh()
    })
  }
  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteBookingAddOnAction(deleting.id)
      if (!result.ok) { toast.error(result.error || "Could not delete the add-on."); return }
      toast.success(`${deleting.name} deleted.`)
      setDeleting(null)
      router.refresh()
    })
  }
  return <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h2 className="text-lg font-semibold">Booking add-ons</h2><p className="mt-1 text-sm text-muted-foreground">Enabled options appear in the customer details step and are included in the fare.</p></div><div className="space-y-2">{addOns.map((addOn) => <div key={addOn.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"><span className={addOn.active ? "" : "text-muted-foreground line-through"}>{addOn.name}</span><div className="flex items-center gap-3"><span className="font-medium">{formatCurrency(addOn.price)}</span><Button size="sm" variant={addOn.active ? "outline" : "default"} disabled={isPending} onClick={() => toggle(addOn)}>{addOn.active ? "Disable" : "Enable"}</Button>{/* Only a disabled add-on can be deleted — an active one is still offered to customers. */}{!addOn.active && <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setDeleting(addOn)}>Delete</Button>}</div></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end"><div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Extra stop" /></div><div><Label>Price (£)</Label><Input type="number" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} /></div><Button onClick={add} disabled={isPending}>Add option</Button></div>
    {deleting && <DeleteAddOnDialog addOn={deleting} pending={isPending} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
  </section>
}

function DeleteAddOnDialog({ addOn, pending, onCancel, onConfirm }: { addOn: AddOn; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("")
  const matches = typed.trim() === addOn.name
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Confirm delete add-on">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">Delete &ldquo;{addOn.name}&rdquo;?</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This permanently removes the add-on. Past bookings that already included it keep their own record. This can&apos;t be undone.
        </p>
        <div className="mt-4 space-y-1.5">
          <Label>
            Type <span className="font-semibold text-foreground">{addOn.name}</span> to confirm
          </Label>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>Cancel</Button>
          <Button variant="destructive" disabled={!matches || pending} onClick={onConfirm}>Delete add-on</Button>
        </div>
      </div>
    </div>
  )
}
