"use client"

import { useState, useSyncExternalStore, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Check, Copy, Loader2, LogOut, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangePasswordForm } from "@/components/change-password-form"
import { PasswordChecklist } from "@/components/password-checklist"
import { passwordProblem } from "@/lib/password-policy"
import { changeCustomerPasswordAction, confirmCustomerEmailChangeAction, loginCustomer, logoutCustomer, registerCustomer, requestCustomerEmailChangeAction, resendCustomerCode, updateCustomerProfileAction, verifyCustomerEmail, type CustomerAuthResult } from "@/lib/actions"
import { cn } from "@/lib/utils"

const TITLES = { signin: "Sign in", register: "Create an account", verify: "Check your email" }

/** Set by /api/auth/google/callback as ?error= when Google sign-in doesn't complete. */
const GOOGLE_ERRORS: Record<string, string> = {
  "google-cancelled": "Google sign-in was cancelled.",
  "google-unverified": "Your Google account's email address isn't verified with Google.",
  "google-conflict": "This email is already linked to a different Google account.",
  "google-unavailable": "Google sign-in isn't available right now. Use your email and password instead.",
  "google-failed": "Google sign-in didn't work. Please try again.",
}

export function AccountForms({ googleEnabled = false, googleError, passwordReset = false }: { googleEnabled?: boolean; googleError?: string; passwordReset?: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "register" | "verify">("signin")
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" })
  const [code, setCode] = useState("")
  const [error, setError] = useState(googleError ? GOOGLE_ERRORS[googleError] ?? GOOGLE_ERRORS["google-failed"] : "")
  const [notice, setNotice] = useState(passwordReset ? "Your password has been reset and you've been signed out everywhere. Sign in with your new password." : "")
  const [isPending, startTransition] = useTransition()
  const registering = mode === "register"
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  })

  function run(action: () => Promise<CustomerAuthResult>, sentNotice = "") {
    setError("")
    setNotice("")
    startTransition(async () => {
      const result = await action()
      if (!result.ok) { setError(result.error || "Something went wrong. Please try again."); return }
      if (result.needsCode) { setMode("verify"); setCode(""); setNotice(sentNotice); return }
      router.refresh()
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "verify") run(() => verifyCustomerEmail(form.email, code))
    else if (registering) run(() => registerCustomer(form))
    else run(() => loginCustomer(form.email, form.password))
  }

  function switchMode(next: "signin" | "register") {
    setMode(next)
    setError("")
    setNotice("")
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight">{TITLES[mode]}</h2>
      {googleEnabled && mode !== "verify" && (
        <>
          {/* Full-page navigation (not a client Link): it leaves the site for Google. */}
          <Button variant="outline" className="mt-4 w-full" nativeButton={false} render={<a href="/api/auth/google" />}>
            <GoogleIcon />
            Continue with Google
          </Button>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
        </>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {mode === "verify" ? (
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-medium text-foreground">{form.email}</span>. Enter it below to verify your email.</p>
            <Label htmlFor="account-code" className="pt-2">Verification code</Label>
            <Input id="account-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus className="text-center font-mono text-lg tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </div>
        ) : (
          <>
            {registering && (
              <>
                <div className="space-y-1.5"><Label htmlFor="account-name">Full name</Label><Input id="account-name" required autoComplete="name" {...field("name")} /></div>
                <div className="space-y-1.5"><Label htmlFor="account-phone">Phone</Label><Input id="account-phone" type="tel" required autoComplete="tel" {...field("phone")} /></div>
              </>
            )}
            <div className="space-y-1.5"><Label htmlFor="account-email">Email</Label><Input id="account-email" type="email" required autoComplete="email" {...field("email")} /></div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="account-password">Password</Label>
                {mode === "signin" && <Link href="/account/forgot-password" className="text-xs font-medium text-primary underline-offset-4 hover:underline">Forgot password?</Link>}
              </div>
              <Input id="account-password" type="password" required aria-describedby={registering ? "account-password-rules" : undefined} autoComplete={registering ? "new-password" : "current-password"} {...field("password")} />
              {registering && <PasswordChecklist id="account-password-rules" password={form.password} email={form.email} />}
            </div>
          </>
        )}
        {notice && <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">{notice}</p>}
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isPending || (mode === "verify" && code.length !== 6) || (registering && passwordProblem(form.password, form.email) !== null)}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {mode === "verify" ? "Verify email" : registering ? "Create account" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "verify" ? (
          <>
            Didn&apos;t get it?{" "}
            <button type="button" disabled={isPending} className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => run(() => resendCustomerCode(form.email), "If a minute has passed, a new code is on its way.")}>Resend code</button>
            {" · "}
            <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => switchMode("register")}>Change email</button>
          </>
        ) : (
          <>
            {registering ? "Already have an account?" : "New here?"}{" "}
            <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => switchMode(registering ? "signin" : "register")}>
              {registering ? "Sign in" : "Create an account"}
            </button>
          </>
        )}
      </p>
    </div>
  )
}

export function CustomerLogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={() => startTransition(async () => { await logoutCustomer(); router.refresh() })}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Sign out
    </Button>
  )
}

/** The customer's referral link with copy (and, on phones, native share). */
export function ReferralShare({ code }: { code: string }) {
  const origin = useSyncExternalStore(() => () => {}, () => window.location.origin, () => process.env.NEXT_PUBLIC_APP_URL ?? "")
  const link = `${origin}/?ref=${code}`
  const canShare = useSyncExternalStore(() => () => {}, () => "share" in navigator, () => false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (permissions, insecure origin) — the link is selectable anyway.
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input readOnly aria-label="Your referral link" value={link} onFocus={(e) => e.target.select()} className="font-mono text-sm" />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy link"}</Button>
        {canShare && (
          <Button type="button" variant="outline" onClick={() => navigator.share({ title: "ONE Airport Taxi", text: "Book your airport transfer with ONE Airport Taxi:", url: link }).catch(() => {})}>
            <Share2 className="size-4" />Share
          </Button>
        )}
      </div>
    </div>
  )
}

const ACCOUNT_TABS = [
  { href: "/account", label: "Bookings" },
  { href: "/account/referrals", label: "Referrals" },
  { href: "/account/settings", label: "Settings" },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {ACCOUNT_TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={cn("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors", active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

function FormMessage({ error, success }: { error: string; success: string }) {
  if (error) return <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
  if (success) return <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{success}</p>
  return null
}

/**
 * Name, phone, and email in one form with a single "Save changes" button. Changing the email
 * still needs its own confirm-the-code step below (it can't be collapsed into the same click —
 * the code hasn't been sent yet), but the button that kicks everything off is unified.
 */
export function ProfileForm({ name, phone, email, hasPassword }: { name: string; phone: string; email: string; hasPassword: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({ name, phone, email })
  const [currentPassword, setCurrentPassword] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"edit" | "confirm">("edit")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()
  const emailChanged = form.email.trim().toLowerCase() !== email.trim().toLowerCase()
  const unchanged = form.name === name && form.phone === phone && !emailChanged

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess("")
    if (emailChanged && !currentPassword) { setError("Enter your current password to change your email address."); return }
    startTransition(async () => {
      if (emailChanged) {
        const emailResult = await requestCustomerEmailChangeAction(form.email, currentPassword)
        if (!emailResult.ok) { setError(emailResult.error || "Something went wrong. Please try again."); return }
      }
      const profileResult = await updateCustomerProfileAction({ name: form.name, phone: form.phone })
      if (!profileResult.ok) { setError(profileResult.error || "Something went wrong. Please try again."); return }
      if (emailChanged) { setStep("confirm"); setCurrentPassword("") }
      else setSuccess("Your details have been saved.")
      router.refresh()
    })
  }

  function confirmEmail(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await confirmCustomerEmailChangeAction(code)
      if (!result.ok) { setError(result.error || "Something went wrong. Please try again."); return }
      setStep("edit"); setCode("")
      setSuccess("Your email has been changed. Use the new address next time you sign in.")
      router.refresh()
    })
  }

  if (step === "confirm") {
    return (
      <form onSubmit={confirmEmail} className="space-y-4">
        <p className="text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-medium text-foreground">{form.email}</span>. Enter it to switch to this address.</p>
        <div className="max-w-48 space-y-1.5">
          <Label htmlFor="email-change-code">Verification code</Label>
          <Input id="email-change-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus className="text-center font-mono text-lg tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </div>
        <FormMessage error={error} success="" />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || code.length !== 6}>{isPending && <Loader2 className="size-4 animate-spin" />}Confirm new email</Button>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => { setStep("edit"); setForm({ ...form, email }); setError("") }}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="profile-phone">Phone</Label><Input id="profile-phone" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" type="email" required autoComplete="email" disabled={!hasPassword} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {!hasPassword && <p className="text-xs text-muted-foreground">Signed in with Google — set a password to change your email address.</p>}
      </div>
      {emailChanged && (
        <div className="space-y-1.5">
          <Label htmlFor="profile-current-password">Current password</Label>
          <Input id="profile-current-password" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
      )}
      <FormMessage error={error} success={success} />
      <Button type="submit" disabled={isPending || unchanged}>{isPending && <Loader2 className="size-4 animate-spin" />}Save changes</Button>
    </form>
  )
}

/** "Change password" trigger + the actual form inside a popup, instead of sitting inline on the page. */
export function ChangePasswordDialog({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [open, setOpen] = useState(false)
  const label = hasPassword ? "Change password" : "Set a password"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          {!hasPassword && <DialogDescription>Optional: lets you sign in with your email and password as well as Google.</DialogDescription>}
        </DialogHeader>
        <ChangePasswordForm email={email} action={changeCustomerPasswordAction} requireCurrent={hasPassword} />
      </DialogContent>
    </Dialog>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.87 8.87 4.76 12 4.76Z" />
    </svg>
  )
}
