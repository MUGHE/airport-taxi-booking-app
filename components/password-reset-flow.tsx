"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangePasswordForm } from "@/components/change-password-form"
import { endPasswordResetAction, requestPasswordResetAction, resendPasswordResetCodeAction, resetPasswordAction, verifyPasswordResetCodeAction } from "@/lib/actions"

type ResetResult = { ok: boolean; error?: string; restart?: boolean }

// Ties the flow to this browser tab. sessionStorage survives reloads but is wiped when the
// tab closes, so a closed tab's flow can't be picked up again (the server checks this id on
// every step; see readResetFlow in lib/actions.ts).
const TAB_KEY = "password-reset-tab"
// Fallback when sessionStorage is blocked: lasts until reload, enough to finish the flow.
let memoryTabId = ""
function readTabId(): string {
  try { return sessionStorage.getItem(TAB_KEY) ?? memoryTabId } catch { return memoryTabId }
}
function newTabId(): string {
  // getRandomValues, not randomUUID: the latter is missing on plain-http LAN dev origins.
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("")
  memoryTabId = id
  try { sessionStorage.setItem(TAB_KEY, id) } catch { /* storage blocked: memoryTabId covers this page */ }
  return id
}
function forgetTabId() {
  memoryTabId = ""
  try { sessionStorage.removeItem(TAB_KEY) } catch { /* nothing to forget */ }
}

/**
 * The step is decided by the server (see app/account/forgot-password/page.tsx); after each
 * action this only asks the server to re-render, so it never chooses a step itself. The flow
 * ends on its own when its time runs out or when the tab that started it is gone.
 */
export function PasswordResetFlow({ stage, maskedEmail, resendIn = 0, codeSentAt = 0, expiresIn = 0 }: {
  stage: "request" | "code" | "verified"
  maskedEmail?: string
  /** Seconds until "Resend code" unlocks, as computed by the server. */
  resendIn?: number
  /** When the current code was sent; restarts the countdown after each resend. */
  codeSentAt?: number
  /** Seconds until this reset session runs out. */
  expiresIn?: number
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [isPending, startTransition] = useTransition()
  const resendLeft = useCountdown(resendIn, codeSentAt)
  const inFlow = stage !== "request"

  function run(action: () => Promise<ResetResult>, successNotice = "") {
    setError("")
    setNotice("")
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error || "Something went wrong. Please try again.")
      else setNotice(successNotice)
      if (result.restart) forgetTabId()
      setCode("")
      router.refresh()
    })
  }

  // A flow this tab didn't start (the original tab was closed, or the link was opened
  // elsewhere) is ended straight away rather than continued.
  useEffect(() => {
    if (inFlow && !readTabId()) run(endPasswordResetAction)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the step changes
  }, [inFlow])

  // Time's up: end the flow without waiting for the next click.
  useEffect(() => {
    if (!inFlow || expiresIn <= 0) return
    const id = setTimeout(() => run(endPasswordResetAction), expiresIn * 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-armed when the server's deadline changes
  }, [inFlow, expiresIn])

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
        <ChangePasswordForm
          email=""
          requireCurrent={false}
          successHref="/account?reset=1"
          action={async (_current, next) => {
            const result = await resetPasswordAction(next, readTabId())
            if (result.ok || result.restart) forgetTabId()
            if (result.restart) {
              setError(result.error ?? "")
              router.refresh()
            }
            return result
          }}
        />
      </div>
    )
  }

  if (stage === "code") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); run(() => verifyPasswordResetCodeAction(code, readTabId())) }} className="space-y-4">
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
            onClick={() => run(() => resendPasswordResetCodeAction(readTabId()), "A new code is on its way.")}
          >
            {resendLeft > 0 ? `Resend code in 0:${String(resendLeft).padStart(2, "0")}` : "Resend code"}
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => requestPasswordResetAction(email, newTabId())) }} className="space-y-4">
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
