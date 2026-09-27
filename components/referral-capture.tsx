"use client"

import { useEffect } from "react"
import { REFERRAL_COOKIE, REFERRAL_COOKIE_DAYS } from "@/lib/session-config"

/**
 * Remembers the referral code from a `?ref=CODE` link (on any page) so a booking made later
 * in the visit, or within the next 30 days, credits the referrer. The latest link wins.
 * Reads window.location instead of useSearchParams so static pages stay static.
 */
export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase()
    if (!code || !/^[A-Z0-9]{8}$/.test(code)) return
    document.cookie = `${REFERRAL_COOKIE}=${code}; path=/; max-age=${REFERRAL_COOKIE_DAYS * 24 * 60 * 60}; samesite=lax`
  }, [])
  return null
}
