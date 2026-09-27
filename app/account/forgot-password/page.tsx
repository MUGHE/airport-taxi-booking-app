import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PasswordResetFlow } from "@/components/password-reset-flow"
import { RESET_RESEND_MS, getCustomer, readPasswordResetState } from "@/lib/session"

export const metadata: Metadata = { title: "Reset password" }
export const dynamic = "force-dynamic"

/** "shahid@gmail.com" → "sh••••@gmail.com", enough to recognise without displaying it in full. */
function maskEmail(email: string): string {
  const [name, domain] = email.split("@")
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`
}

// One URL for the whole flow: the step shown comes only from the signed, httpOnly cookie the
// server set for this browser, so no step can be reached by editing the address.
export default async function ForgotPasswordPage() {
  if (await getCustomer()) redirect("/account/settings")
  const state = await readPasswordResetState()
  // Seconds until "Resend code" unlocks, from when the server last sent one (survives reloads).
  const resendIn = state?.stage === "code" && state.sentAt ? Math.max(0, Math.ceil((state.sentAt + RESET_RESEND_MS - Date.now()) / 1000)) : 0

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <PasswordResetFlow stage={state?.stage ?? "request"} maskedEmail={state?.stage === "code" ? maskEmail(state.email) : undefined} resendIn={resendIn} codeSentAt={state?.stage === "code" ? state.sentAt : 0} />
      </div>
    </div>
  )
}
