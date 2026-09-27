"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordChecklist } from "@/components/password-checklist"
import { passwordProblem } from "@/lib/password-policy"

/**
 * Current + new + confirm password form, shared by staff and customers. `action` is the
 * server action that re-checks everything; `successHref` navigates away on success,
 * otherwise the form clears and confirms in place. `children` renders below the button.
 * `requireCurrent={false}` is for setting a first password (Google-only customer accounts).
 */
export function ChangePasswordForm({ email, action, successHref, requireCurrent = true, children }: {
  email: string
  action: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  successHref?: string
  requireCurrent?: boolean
  children?: React.ReactNode
}) {
  const router = useRouter()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const mismatch = confirm.length > 0 && confirm !== next

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setDone(false)
    if (next !== confirm) return setError("The new passwords don't match.")
    startTransition(async () => {
      const result = await action(current, next)
      if (!result.ok) { setError(result.error || "Something went wrong. Please try again."); return }
      if (successHref) { router.push(successHref); router.refresh(); return }
      setCurrent(""); setNext(""); setConfirm("")
      setDone(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {requireCurrent && <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input id="current-password" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>}
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input id="new-password" type="password" required autoComplete="new-password" aria-describedby="new-password-rules" value={next} onChange={(e) => setNext(e.target.value)} />
        <PasswordChecklist id="new-password-rules" password={next} email={email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input id="confirm-password" type="password" required autoComplete="new-password" aria-invalid={mismatch} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {mismatch && <p className="text-xs text-destructive">Doesn&apos;t match the new password.</p>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {done && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">Your password has been updated.</p>}
      <Button type="submit" className="w-full" disabled={isPending || (requireCurrent && !current) || mismatch || passwordProblem(next, email) !== null}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {requireCurrent ? "Update password" : "Set password"}
      </Button>
      {children}
    </form>
  )
}
