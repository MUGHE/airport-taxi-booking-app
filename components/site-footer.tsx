import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock3, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CALL_LINK, CALL_NUMBER, EMAIL_LINK, CONTACT_EMAIL } from "@/lib/contact"

export function SiteFooter() {
  return (
    <footer className="site-footer relative overflow-hidden bg-[#041728] text-white">
      <div className="pointer-events-none absolute -top-40 right-[-10%] size-96 rounded-full bg-[#0875d1]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] size-80 rounded-full bg-[#0a8b8f]/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid size-13 place-items-center rounded-full bg-white shadow-lg shadow-black/20">
                <Image src="/brand/logo-mark.png" alt="ONE Airport Taxi" width={44} height={44} className="size-11" />
              </span>
              <span>
                <strong className="block text-xl tracking-tight">ONE Airport Taxi</strong>
                <small className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.18em] text-sky-300">Driven by reliability</small>
              </span>
            </Link>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/62">
              Fixed-price airport transfers with professional chauffeurs, flight-aware pickup and support whenever your plans change.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FooterContact href={CALL_LINK} icon={Phone} label="Call our team" value={CALL_NUMBER} />
            <FooterContact href={EMAIL_LINK} icon={Mail} label="Email support" value={CONTACT_EMAIL} />
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Travel with confidence</p>
            <div className="mt-5 space-y-4 text-sm text-white/65">
              <p className="flex items-start gap-3"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /> Available for pre-booked airport journeys, day or night.</p>
              <p className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" /> Door-to-door transfers across airports, cities and hotels.</p>
            </div>
            <Button className="mt-6 bg-white text-[#071d33] hover:bg-sky-50" nativeButton={false} render={<Link href="/book" />}>
              Book your transfer <ArrowRight className="size-4" />
            </Button>
          </div>

          <FooterCol title="Services" links={[
            { href: "/book", label: "Book a Ride" },
            { href: "/airport-transfers", label: "Airport Transfers" },
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
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ONE Airport Taxi. All rights reserved.</p>
          <p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-400" /> Secure online booking · Clear pricing</p>
        </div>
      </div>
    </footer>
  )
}

function FooterContact({ href, icon: Icon, label, value }: { href: string; icon: typeof Phone; label: string; value: string }) {
  return (
    <a href={href} className="group flex min-w-0 items-center gap-3 border border-white/12 bg-white/5 p-4 transition-colors hover:border-sky-300/35 hover:bg-white/8">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-400/12 text-sky-300"><Icon aria-hidden="true" className="size-4" /></span>
      <span className="min-w-0">
        <small className="block text-[10px] font-semibold uppercase tracking-[.12em] text-white/45">{label}</small>
        <strong className="mt-1 block truncate text-sm font-semibold text-white/88">{value}</strong>
      </span>
      <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-300" />
    </a>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[.16em] text-white">{title}</h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex items-center text-sm text-white/58 transition-colors hover:text-sky-300">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
