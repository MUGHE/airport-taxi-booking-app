"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangePasswordForm } from "@/components/change-password-form"
import { cancelPasswordResetAction, requestPasswordResetAction, resendPasswordResetCodeAction, resetPasswordAction, verifyPasswordResetCodeAction } from "@/lib/actions"

/**
 * The step is decided by the server (see app/account/forgot-password/page.tsx); after each
 * action this only asks the server to re-render, so it never chooses a step itself.
 */
export function PasswordResetFlow({ stage, maskedEmail, resendIn = 0, codeSentAt = 0 }: {
  stage: "request" | "code" | "verified"
  maskedEmail?: string
  /** Seconds until "Resend code" unlocks, as computed by the server. */
  resendIn?: number
  /** When the current code was sent; restarts the countdown after each resend. */
  codeSentAt?: number
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [isPending, startTransition] = useTransition()
  const resendLeft = useCountdown(resendIn, codeSentAt)

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successNotice = "") {
    setError("")
    setNotice("")
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error || "Something went wrong. Please try again.")
      else setNotice(successNotice)
      setCode("")
      router.refresh()
    })
  }

  const messages = (
    <>
      {notice && <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    </>
  )

  if (stage === "verified") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Choose a new password. You&apos;ll be signed out on every device and can then sign in with it.</p>
        {messages}
        <ChangePasswordForm email="" requireCurrent={false} successHref="/account?reset=1" action={(_current, next) => resetPasswordAction(next)} />
        <StartAgain disabled={isPending} onClick={() => run(cancelPasswordResetAction)} />
      </div>
    )
  }

  if (stage === "code") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); run(() => verifyPasswordResetCodeAction(code)) }} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If <span className="font-medium text-foreground">{maskedEmail}</span> has an account, we&apos;ve emailed it a 6-digit code. It expires in 10 minutes.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="reset-code">Code</Label>
          <Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus className="text-center font-mono text-lg tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </div>
        {messages}
        <Button type="submit" className="w-full" disabled={isPending || code.length !== 6}>{isPending && <Loader2 className="size-4 animate-spin" />}Continue</Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            disabled={isPending || resendLeft > 0}
            className="font-medium text-primary underline-offset-4 enabled:hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
            onClick={() => run(resendPasswordResetCodeAction, "A new code is on its way.")}
          >
            {resendLeft > 0 ? `Resend code in 0:${String(resendLeft).padStart(2, "0")}` : "Resend code"}
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => requestPasswordResetAction(email)) }} className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter the email you signed up with and we&apos;ll send you a code to reset your password.</p>
      <div className="space-y-1.5">
        <Label htmlFor="reset-email">Email</Label>
        <Input id="reset-email" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {messages}
      <Button type="submit" className="w-full" disabled={isPending || !email}>{isPending && <Loader2 className="size-4 animate-spin" />}Send code</Button>
      <p className="text-center text-sm text-muted-foreground"><Link href="/account" className="font-medium text-primary underline-offset-4 hover:underline">Back to sign in</Link></p>
    </form>
  )
}

function StartAgain({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} className="text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={onClick}>Start again</button>
}

/**
 * Counts `seconds` down to 0. Re-arms whenever `restartKey` changes (a new code was sent),
 * even if `seconds` is the same 60 as last time. Measured against the clock, not tick
 * counts, so a backgrounded tab doesn't fall behind.
 */
function useCountdown(seconds: number, restartKey: number): number {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const end = Date.now() + seconds * 1000
    const tick = () => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)))
    tick()
    if (seconds <= 0) return
    const id = setInterval(tick, 250)
    const stop = setTimeout(() => clearInterval(id), seconds * 1000 + 500)
    return () => { clearInterval(id); clearTimeout(stop) }
  }, [seconds, restartKey])
  return left
}
