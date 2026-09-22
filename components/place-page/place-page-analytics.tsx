"use client"

import { useEffect } from "react"
import { trackPublicEvent } from "@/lib/analytics"

export function PlacePageAnalytics({ sourcePlaceId, sourcePlaceSlug, fallback }: { sourcePlaceId?: string; sourcePlaceSlug?: string; fallback: boolean }) {
  useEffect(() => {
    trackPublicEvent({ name: "place_page_view", sourcePlaceId, sourcePlaceSlug, fallback })
  }, [fallback, sourcePlaceId, sourcePlaceSlug])
  return null
}
