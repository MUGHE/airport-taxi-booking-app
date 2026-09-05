import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { CALL_LINK, CALL_NUMBER, CONTACT_EMAIL, EMAIL_LINK, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/contact"
import { PRIVACY_SECTIONS, PRIVACY_SUBTITLE, PRIVACY_TITLE } from "@/lib/privacy-content"

export const metadata: Metadata = {
  title: PRIVACY_TITLE,
  description: "Learn how ONE Airport Taxi collects, uses, protects, and shares personal information.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">{PRIVACY_TITLE}</h1>
            <p className="mt-2 text-muted-foreground">{PRIVACY_SUBTITLE}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              At ONE Airport Taxi, we value your privacy and work hard to keep your
              personal information safe. This Privacy Policy explains what information
              we collect when you visit our website, book a ride, contact us, or use our
              airport transfer and private-hire services. It also covers how we use,
              store, protect, and share your information.
            </p>
            <p className="mt-3">
              When you use our website or book our services, you agree to the practices
              described in this Privacy Policy.
            </p>
          </div>

          <nav aria-label="Sections" className="mt-8 rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold">On this page</p>
            <ol className="grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {PRIVACY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="transition-colors hover:text-foreground">
                    {section.heading}
                  </a>
                </li>
              ))}
              <li>
                <a href="#contact" className="transition-colors hover:text-foreground">
                  Contact Us
                </a>
              </li>
            </ol>
          </nav>

          <div className="mt-10 divide-y divide-border">
            {PRIVACY_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20 py-8 first:pt-0">
                <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
            <section id="contact" className="scroll-mt-20 py-8">
              <h2 className="text-xl font-semibold tracking-tight">Contact Us</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  If you have any questions about this Privacy Policy, your personal
                  information, or how ONE Airport Taxi handles your data, please get in
                  touch with us.
                </p>
                <address className="not-italic">
                  <p className="font-medium text-foreground">ONE Airport Taxi</p>
                  <p className="mt-2">
                    Website: <Link href="/" className="font-medium text-primary hover:underline">oneairporttaxi.com</Link>
                  </p>
                  <p>
                    Email: <a href={EMAIL_LINK} className="font-medium text-primary hover:underline">{CONTACT_EMAIL}</a>
                  </p>
                  <p>
                    Phone: <a href={CALL_LINK} className="font-medium text-primary hover:underline">{CALL_NUMBER}</a>
                  </p>
                  <p>
                    WhatsApp: <a href={WHATSAPP_LINK} className="font-medium text-primary hover:underline">+{WHATSAPP_NUMBER}</a>
                  </p>
                </address>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
