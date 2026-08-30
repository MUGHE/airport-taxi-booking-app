import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MessageCircle, Phone } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  CALL_LINK,
  CALL_NUMBER,
  CONTACT_EMAIL,
  EMAIL_LINK,
  WHATSAPP_LINK,
  WHATSAPP_NUMBER,
} from "@/lib/contact"

export const metadata: Metadata = {
  title: "Contact Us | ONE Airport Taxi",
  description:
    "Get in touch with ONE Airport Taxi by WhatsApp, phone, or email for bookings, changes, and support.",
}

type ContactMethod = {
  icon: typeof MessageCircle
  label: string
  value: string
  href: string
  target?: "_blank"
  accent: string
}

const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: WHATSAPP_NUMBER,
    href: WHATSAPP_LINK,
    target: "_blank",
    accent: "bg-[#25D366] text-white",
  },
  {
    icon: Phone,
    label: "Call us",
    value: CALL_NUMBER,
    href: CALL_LINK,
    accent: "bg-primary text-primary-foreground",
  },
  {
    icon: Mail,
    label: "Email",
    value: CONTACT_EMAIL,
    href: EMAIL_LINK,
    accent: "bg-secondary text-secondary-foreground",
  },
]

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
            <p className="mt-2 text-muted-foreground">
              For bookings, changes, cancellations, or complaints, reach our team
              directly &mdash; we&apos;re glad to help.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CONTACT_METHODS.map((method) => (
              <a
                key={method.label}
                href={method.href}
                target={method.target}
                rel={method.target ? "noopener noreferrer" : undefined}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-5 transition-colors hover:border-primary/40"
              >
                <span
                  className={`flex size-10 items-center justify-center rounded-full ${method.accent}`}
                >
                  <method.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{method.label}</p>
                  <p className="mt-0.5 text-sm break-all text-muted-foreground">
                    {method.value}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            Already have a booking? Include your booking reference when you get in
            touch so we can help faster &mdash; you can also{" "}
            <Link href="/track" className="font-medium text-primary hover:underline">
              track your booking
            </Link>{" "}
            directly.
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
