import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/brand/logo-mark.png" alt="ONE Airport Taxi" width={40} height={40} className="size-10" />
            <span className="text-lg tracking-tight">ONE Airport Taxi</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Reliable, fixed-price airport transfers with professional chauffeurs,
            available 24/7.
          </p>
        </div>

        <FooterCol
          title="Service"
          links={[
            { href: "/book", label: "Book a Ride" },
            { href: "/#fleet", label: "Our Fleet" },
            { href: "/#how", label: "How It Works" },
            { href: "/track", label: "Track Booking" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: "/about", label: "About Us" },
            { href: "/admin", label: "Admin Portal" },
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            { href: "/help", label: "Help Center" },
            { href: "/contact", label: "Contact" },
            { href: "/terms", label: "Terms" },
            { href: "/", label: "Privacy" },
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ONE Airport Taxi. All rights reserved.
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((l, i) => (
          <li key={`${l.label}-${i}`}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
