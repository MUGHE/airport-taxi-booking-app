"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, BadgePercent } from "lucide-react"

/** The site-wide promotion strip under the header, in the same colours as the home page hero's offer box. */
export function SiteOfferBar({ percent }: { percent: number }) {
  const pathname = usePathname()
  // The home page hero and the booking form already show this offer.
  if (pathname === "/" || pathname === "/book") return null
  return (
    <aside className="site-offer-bar" aria-label="Current offer">
      <div className="site-offer-bar-inner">
        <Link href="/book" className="site-offer-bar-deal">
          <BadgePercent aria-hidden="true" />
          <span>{percent}% off every booking, applied at checkout</span>
          <ArrowRight aria-hidden="true" className="site-offer-bar-arrow" />
        </Link>
        <p className="site-offer-bar-notes">
          <span>No account needed</span>
          <span>No surge pricing</span>
          <span>Free flight tracking</span>
        </p>
      </div>
    </aside>
  )
}
