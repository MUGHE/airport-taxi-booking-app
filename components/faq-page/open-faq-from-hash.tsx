"use client"

import { useEffect } from "react"

// When the URL hash names an FAQ question (from a Help Centre "full answer" link, or a shared link),
// open that question's accordion item and scroll it into view.
export function OpenFaqFromHash({ prefix }: { prefix: string }) {
  useEffect(() => {
    const open = (hash: string) => {
      if (!hash.startsWith(`#${prefix}`)) return
      const item = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (item?.dataset.slot !== "accordion-item") return
      const trigger = item.querySelector<HTMLButtonElement>("[data-slot=accordion-trigger]")
      if (trigger?.getAttribute("aria-expanded") === "false") trigger.click()
      item.scrollIntoView({ block: "start" })
    }
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.<HTMLAnchorElement>(`a[href^="#${prefix}"]`)
      // Same-hash clicks fire no hashchange, so open from the click as well.
      if (link) requestAnimationFrame(() => open(link.getAttribute("href") ?? ""))
    }
    const onHashChange = () => open(window.location.hash)
    open(window.location.hash)
    document.addEventListener("click", onClick)
    window.addEventListener("hashchange", onHashChange)
    return () => {
      document.removeEventListener("click", onClick)
      window.removeEventListener("hashchange", onHashChange)
    }
  }, [prefix])
  return null
}
