"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { logoutAdmin, pingAdminSession } from "@/lib/actions"
import { ADMIN_IDLE_TIMEOUT_MINUTES, ADMIN_IDLE_WARNING_MINUTES } from "@/lib/session-config"

const IDLE_TIMEOUT_MS = ADMIN_IDLE_TIMEOUT_MINUTES * 60 * 1000
const WARNING_LEAD_MS = ADMIN_IDLE_WARNING_MINUTES * 60 * 1000
const CHECK_INTERVAL_MS = 5000

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const

/**
 * Signs the admin out after ADMIN_IDLE_TIMEOUT_MINUTES of no mouse/keyboard/
 * scroll activity, with a warning toast shortly before it happens.
 *
 * This is the client-side half of the idle timeout — `proxy.ts` enforces
 * the same window server-side (a request older than the idle window is
 * rejected regardless of this component), so a closed/frozen tab still gets
 * signed out even if this code never runs. This component just makes an open,
 * genuinely idle tab log itself out immediately instead of waiting for the
 * admin's next click to discover the session is already dead.
 */
export function IdleSessionGuard() {
  const router = useRouter()
  const lastActivityRef = useRef(Date.now())
  const warningToastIdRef = useRef<string | number | null>(null)
  const loggedOutRef = useRef(false)

  useEffect(() => {
    function dismissWarning() {
      if (warningToastIdRef.current !== null) {
        toast.dismiss(warningToastIdRef.current)
        warningToastIdRef.current = null
      }
    }

    function handleActivity() {
      lastActivityRef.current = Date.now()
      dismissWarning()
    }

    function staySignedIn() {
      lastActivityRef.current = Date.now()
      dismissWarning()
      // Round-trips through proxy.ts, renewing the server-side cookie too.
      pingAdminSession().catch(() => {})
    }

    async function signOutForInactivity() {
      if (loggedOutRef.current) return
      loggedOutRef.current = true
      dismissWarning()
      await logoutAdmin().catch(() => {})
      toast.message("Signed out due to inactivity", {
        description: `You were logged out after ${ADMIN_IDLE_TIMEOUT_MINUTES} minutes of inactivity.`,
      })
      router.push("/admin/login?reason=idle")
      router.refresh()
    }

    function checkIdle() {
      if (loggedOutRef.current) return
      const idleFor = Date.now() - lastActivityRef.current

      if (idleFor >= IDLE_TIMEOUT_MS) {
        void signOutForInactivity()
        return
      }

      if (idleFor >= IDLE_TIMEOUT_MS - WARNING_LEAD_MS && warningToastIdRef.current === null) {
        warningToastIdRef.current = toast.warning("You'll be signed out soon", {
          description: "You've been inactive for a while. Staying on this page will sign you out shortly.",
          duration: WARNING_LEAD_MS,
          action: {
            label: "Stay signed in",
            onClick: staySignedIn,
          },
        })
      }
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true })
    }
    // Catch up immediately on return to the tab — timers can be throttled while backgrounded.
    document.addEventListener("visibilitychange", checkIdle)

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity)
      }
      document.removeEventListener("visibilitychange", checkIdle)
      window.clearInterval(intervalId)
    }
  }, [router])

  return null
}
