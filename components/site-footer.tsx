import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { COMPANY_ADDRESS, COMPANY_LEGAL_NAME, COMPANY_LEGAL_PHONE, COMPANY_REGISTRATION_NUMBER, COMPANY_TRADING_NAME } from "@/lib/company"
import { CALL_LINK, CALL_NUMBER, CONTACT_EMAIL, EMAIL_LINK, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/contact"

export function SiteFooter() {
  return (
    <footer className="site-footer footer-theme relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -top-40 right-[-10%] size-96 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] size-80 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid gap-8 py-10 lg:grid-cols-[minmax(18rem,.8fr)_minmax(0,1.2fr)] lg:items-center lg:py-12">
          <div className="max-w-lg">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid size-13 place-items-center rounded-full bg-card shadow-lg shadow-black/20">
                <Image src="/brand/logo-mark.png" alt="ONE Airport Taxi" width={44} height={44} className="size-11" />
              </span>
              <span>
                <strong className="block text-xl tracking-tight">ONE Airport Taxi</strong>
                <small className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Driven by reliability</small>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Fixed-price airport transfers with professional chauffeurs, flight-aware pickup and support whenever your plans change.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,.9fr)_minmax(13rem,1.2fr)_minmax(0,.9fr)]">
            <FooterContact href={CALL_LINK} icon={Phone} label="Call our team" value={CALL_NUMBER} />
            <FooterContact href={EMAIL_LINK} icon={Mail} label="Email support" value={CONTACT_EMAIL} noWrap />
            <FooterContact href={WHATSAPP_LINK} icon={MessageCircle} label="WhatsApp us" value={`+${WHATSAPP_NUMBER.replace(/^\+/, "")}`} target="_blank" />
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_.85fr_.85fr_.85fr_1.25fr] lg:py-12">
          <div className="rounded-xl bg-card p-5 ring-1 ring-border">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Travel with confidence</p>
            <div className="mt-5 flex flex-col gap-4 text-sm leading-5 text-muted-foreground">
              <p className="flex items-start gap-3"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /> Available for pre-booked airport journeys, day or night.</p>
              <p className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /> Door-to-door transfers across airports, cities and hotels.</p>
            </div>
            <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "mt-6 bg-primary text-primary-foreground hover:bg-primary/85")}>
              Book your transfer <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Link>
          </div>

          <FooterCol title="Services" links={[
            { href: "/book", label: "Book a Ride" },
            { href: "/airport-transfers", label: "Airport Transfers" },
            { href: "/destinations", label: "Destinations" },
            { href: "/#fleet", label: "Our Fleet" },
            { href: "/track", label: "Track Booking" },
          ]} />
          <FooterCol title="Company" links={[
            { href: "/about", label: "About Us" },
            { href: "/contact", label: "Contact" },
            { href: "/help", label: "Help Center" },
          ]} />
          <FooterCol title="Information" links={[
            { href: "/#how", label: "How It Works" },
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
            { href: "/admin", label: "Admin Portal" },
          ]} />
          <FooterCompanyDetails />
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-col gap-3 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ONE Airport Taxi. All rights reserved.</p>
          <p className="flex items-center gap-2"><span aria-hidden="true" className="size-1.5 rounded-full bg-primary" /> Secure online booking · Clear pricing</p>
        </div>
      </div>
    </footer>
  )
}

function FooterContact({ href, icon: Icon, label, value, target, noWrap = false }: { href: string; icon: typeof Phone; label: string; value: string; target?: string; noWrap?: boolean }) {
  return (
    <a href={href} target={target} rel={target ? "noopener noreferrer" : undefined} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card size="sm" className="h-full transition-colors group-hover:bg-accent">
        <CardHeader className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><Icon aria-hidden="true" className="size-4" /></span>
          <CardDescription className="self-center text-[10px] font-semibold uppercase tracking-[.12em]">{label}</CardDescription>
        </CardHeader>
        <CardContent>
          <CardTitle className={cn("text-sm text-card-foreground", noWrap && "whitespace-nowrap tracking-[-.02em]")}>{value}</CardTitle>
        </CardContent>
      </Card>
    </a>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[.16em] text-foreground">{title}</h3>
      <ul className="mt-5 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterCompanyDetails() {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[.16em] text-foreground">Company details</h3>
      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Organisation</dt>
          <dd className="mt-1 text-muted-foreground">{COMPANY_LEGAL_NAME}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Trading name</dt>
          <dd className="mt-1 text-muted-foreground">{COMPANY_TRADING_NAME}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Registered office</dt>
          <dd className="mt-1 max-w-[18rem] leading-6 text-muted-foreground">{COMPANY_ADDRESS}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Companies House</dt>
          <dd className="mt-1 text-muted-foreground">{COMPANY_REGISTRATION_NUMBER}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Phone</dt>
          <dd className="mt-1"><a className="text-muted-foreground transition-colors hover:text-primary" href={`tel:${COMPANY_LEGAL_PHONE.replace(/[^+\d]/g, "")}`}>{COMPANY_LEGAL_PHONE}</a></dd>
        </div>
      </dl>
    </div>
  )
}
