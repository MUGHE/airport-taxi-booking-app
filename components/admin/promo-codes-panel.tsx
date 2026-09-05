"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deletePromoCodeAction, upsertPromoCodeAction } from "@/lib/actions"
import type { PromoCode, PromoDiscountType } from "@/lib/types"
import { toast } from "sonner"

function formatDiscount(promo: Pick<PromoCode, "discountType" | "discountValue">) {
  return promo.discountType === "percent" ? `${promo.discountValue}% off` : `£${promo.discountValue} off`
}

export function PromoCodesPanel({ promoCodes }: { promoCodes: PromoCode[] }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<PromoDiscountType>("percent")
  const [discountValue, setDiscountValue] = useState("")
  const [deleting, setDeleting] = useState<PromoCode | null>(null)
  const [isPending, startTransition] = useTransition()

  function add() {
    const value = Number(discountValue)
    if (!code.trim()) return toast.error("Enter a promo code.")
    if (!Number.isFinite(value) || value <= 0) return toast.error("Enter a valid discount value.")
    if (discountType === "percent" && value > 100) return toast.error("Percentage discount can't exceed 100.")
    startTransition(async () => {
      const result = await upsertPromoCodeAction({ code, discountType, discountValue: value, active: true })
      if (!result.ok) { toast.error(result.error || "Could not add the promo code."); return }
      setCode(""); setDiscountValue("")
      toast.success("Promo code added.")
      router.refresh()
    })
  }
  function toggle(promo: PromoCode) {
    startTransition(async () => {
      const result = await upsertPromoCodeAction({ code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue, active: !promo.active })
      if (!result.ok) { toast.error(result.error || "Could not update the promo code."); return }
      toast.success(`${promo.code} ${promo.active ? "disabled" : "enabled"}.`)
      router.refresh()
    })
  }
  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deletePromoCodeAction(deleting.code)
      if (!result.ok) { toast.error(result.error || "Could not delete the promo code."); return }
      toast.success(`${deleting.code} deleted.`)
      setDeleting(null)
      router.refresh()
    })
  }

  return <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h2 className="text-lg font-semibold">Promo codes</h2><p className="mt-1 text-sm text-muted-foreground">Active codes can be applied at checkout. Disable a code to stop new bookings from using it.</p></div><div className="space-y-2">{promoCodes.length === 0 ? <p className="text-sm text-muted-foreground">No promo codes yet.</p> : promoCodes.map((promo) => <div key={promo.code} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"><span className={promo.active ? "font-mono font-medium" : "font-mono font-medium text-muted-foreground line-through"}>{promo.code}</span><div className="flex items-center gap-3"><span className="font-medium">{formatDiscount(promo)}</span><Button size="sm" variant={promo.active ? "outline" : "default"} disabled={isPending} onClick={() => toggle(promo)}>{promo.active ? "Disable" : "Enable"}</Button>{/* Only a disabled code can be deleted — an active one could still be applied at checkout. */}{!promo.active && <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setDeleting(promo)}>Delete</Button>}</div></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_120px_auto] sm:items-end"><div><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER10" /></div><div><Label>Type</Label><Select value={discountType} onValueChange={(value) => setDiscountType(value as PromoDiscountType)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Percentage</SelectItem><SelectItem value="fixed">Fixed amount</SelectItem></SelectContent></Select></div><div><Label>{discountType === "percent" ? "Percent off" : "Amount off (£)"}</Label><Input type="number" min="0" step={discountType === "percent" ? "1" : "0.5"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} /></div><Button onClick={add} disabled={isPending}>Add code</Button></div>
    {deleting && <DeletePromoCodeDialog promo={deleting} pending={isPending} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
  </section>
}

function DeletePromoCodeDialog({ promo, pending, onCancel, onConfirm }: { promo: PromoCode; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("")
  const matches = typed.trim().toUpperCase() === promo.code
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Confirm delete promo code">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">Delete &ldquo;{promo.code}&rdquo;?</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This permanently removes the promo code. Bookings that already used it keep their own record. This can&apos;t be undone.
        </p>
        <div className="mt-4 space-y-1.5">
          <Label>
            Type <span className="font-mono font-semibold text-foreground">{promo.code}</span> to confirm
          </Label>
          <Input value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} autoFocus autoComplete="off" className="font-mono" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>Cancel</Button>
          <Button variant="destructive" disabled={!matches || pending} onClick={onConfirm}>Delete promo code</Button>
        </div>
      </div>
    </div>
  )
}
