"use client"

import { useEffect, useRef, useState } from "react"
import { LifeBuoy, MessageCircle, Phone, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CALL_LINK, WHATSAPP_LINK } from "@/lib/contact"

export function HelpButton() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
    >
      <div
        className={cn(
          "flex flex-col items-end gap-3 transition-all duration-200",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <ContactAction
          href={WHATSAPP_LINK}
          label="WhatsApp us"
          className="bg-[#25D366] text-white hover:bg-[#1ebe57]"
          onSelect={() => setOpen(false)}
          target="_blank"
        >
          <MessageCircle className="size-5" />
        </ContactAction>

        <ContactAction
          href={CALL_LINK}
          label="Call us"
          className="bg-primary text-primary-foreground hover:bg-primary/80"
          onSelect={() => setOpen(false)}
        >
          <Phone className="size-5" />
        </ContactAction>
      </div>

      <button
        type="button"
        aria-label={open ? "Close help menu" : "Get help"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:bg-primary/80 active:scale-95"
      >
        {open ? <X className="size-6" /> : <LifeBuoy className="size-6" />}
      </button>
    </div>
  )
}

function ContactAction({
  href,
  label,
  className,
  children,
  onSelect,
  target,
}: {
  href: string
  label: string
  className: string
  children: React.ReactNode
  onSelect: () => void
  target?: string
}) {
  return (
    <a
      href={href}
      aria-label={label}
      onClick={onSelect}
      target={target}
      rel={target ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-2"
    >
      <span className="rounded-md bg-card px-2 py-1 text-xs font-medium whitespace-nowrap text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
      {/* Fixed size-14 slot matches the main toggle button below, so this smaller
          size-11 circle shares the same center axis instead of only sharing a right
          edge with it (the parent stack right-aligns so the icon doesn't shift when
          the label reveals on hover). */}
      <span className="flex size-14 items-center justify-center">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
            className,
          )}
        >
          {children}
        </span>
      </span>
    </a>
  )
}
