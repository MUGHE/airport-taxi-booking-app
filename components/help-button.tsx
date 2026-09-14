"use client"

import { MessageCircle, Phone } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CALL_LINK, WHATSAPP_LINK } from "@/lib/contact"

export function HelpButton() {
  const pathname = usePathname()
  const isBookingForm = pathname === "/book"

  return (
    <div
      // bottom-[...] reads --mobile-action-bar-h — set by the booking flow's mobile action bar
      // (booking-flow.tsx) while it's on screen — so this button lifts clear of it instead of
      // sitting underneath. The variable is unset (falls back to 0px) on every other page, so
      // this is identical to a plain bottom-4 there. sm and up never had the bar to begin with.
      className={cn(
        "fixed right-4 bottom-[calc(1rem+var(--mobile-action-bar-h,0px))] z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6",
        isBookingForm && "hidden sm:flex",
      )}
    >
      <ContactAction
        href={WHATSAPP_LINK}
        label="WhatsApp us"
        className="bg-[#25D366] text-white hover:bg-[#1ebe57]"
        target="_blank"
      >
        <MessageCircle className="size-5" />
      </ContactAction>

      <ContactAction
        href={CALL_LINK}
        label="Call us"
        className="bg-primary text-primary-foreground hover:bg-primary/80"
      >
        <Phone className="size-5" />
      </ContactAction>
    </div>
  )
}

function ContactAction({
  href,
  label,
  className,
  children,
  target,
}: {
  href: string
  label: string
  className: string
  children: React.ReactNode
  target?: string
}) {
  return (
    <a
      href={href}
      aria-label={label}
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
