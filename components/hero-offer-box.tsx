import { BadgePercent } from "lucide-react"
import { getSitePromotion } from "@/lib/actions"

const DEFAULT_NOTES = ["No account needed", "No surge pricing", "Free flight tracking"]

/**
 * The hero box under a page's intro: the site-wide offer (while it's on in Admin → Pricing)
 * above the three reassurance notes. Same look as the home page hero.
 */
export async function HeroOfferBox({ notes = DEFAULT_NOTES, className }: { notes?: string[]; className?: string }) {
  // A failed read only hides the offer line; the page still renders.
  const promotion = await getSitePromotion().catch(() => null)
  const offer = promotion?.active && promotion.discountPercent > 0 ? promotion.discountPercent : null
  return (
    <div className={className ? `landing-quote-reassurance hero-offer-box ${className}` : "landing-quote-reassurance hero-offer-box"}>
      {offer != null && <p className="landing-quote-offer"><BadgePercent aria-hidden="true" />{offer}% off every booking, applied at checkout</p>}
      <p className="landing-quote-notes">{notes.map((note) => <span key={note}>{note}</span>)}</p>
    </div>
  )
}
