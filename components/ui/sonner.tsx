"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon, XIcon } from "lucide-react"

const Toaster = ({ closeButton = true, swipeDirections = ["top", "left", "right"], ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      closeButton={closeButton}
      // Sonner only auto-enables the swipe direction matching the toast's own position (a
      // top-center toast defaults to "top" alone), but a sideways swipe is the gesture most
      // people reach for first — it's how phone notifications are normally dismissed — so
      // it needs to work here too, not just a swipe straight up.
      swipeDirections={swipeDirections}
      icons={{
        // The leading glyph IS the dismiss control, so the separate decorative icon it used to
        // duplicate is switched off — an explicit null is what stops sonner rendering the
        // [data-icon] element at all, rather than leaving it to be hidden in CSS.
        success: null,
        info: null,
        warning: null,
        error: null,
        // Except on a loading toast, which sonner gives no close button: there the spinner is
        // still the only thing in the leading slot.
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
        // Sonner takes one close icon for every toast type with no way to vary it per toast, so
        // all the variants are rendered here and globals.css reveals only the one matching the
        // toast's data-type. Keeps each type's own glyph and colour while making that glyph the
        // button that actually dismisses.
        close: (
          <>
            <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" data-toast-glyph="success" />
            <InfoIcon className="size-4 text-primary" data-toast-glyph="info" />
            <TriangleAlertIcon className="size-4 text-accent-foreground" data-toast-glyph="warning" />
            <OctagonXIcon className="size-4 text-destructive" data-toast-glyph="error" />
            <XIcon className="size-4 text-muted-foreground" data-toast-glyph="default" />
          </>
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
