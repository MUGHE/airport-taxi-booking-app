import Link from "next/link"
import { ArrowRight, Check, PlaneTakeoff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WHATSAPP_LINK } from "@/lib/contact"

export function FinalCta() {
  return (
    <section className="landing-final-wrap">
      <div className="landing-container landing-final-cta">
        <div className="landing-final-copy">
          <span className="landing-eyebrow landing-eyebrow-light">Ready when you land</span>
          <h2>Book once. Then stop thinking about it.</h2>
          <p>Know where your driver will be and exactly what you&apos;ll pay, before you even pack.</p>
          <div className="landing-final-points">
            <span><Check aria-hidden="true" /> Fixed fare</span>
            <span><Check aria-hidden="true" /> Flight tracked</span>
            <span><Check aria-hidden="true" /> 24/7 support</span>
          </div>
        </div>
        <div className="landing-final-action">
          <span className="landing-final-icon"><PlaneTakeoff aria-hidden="true" /></span>
          <h3>Your fixed price is 30 seconds away.</h3>
          <p>Enter your route, see your fare, book in a few taps.</p>
          <Button
            size="lg"
            className="bg-white text-[#071d33] hover:bg-sky-50"
            nativeButton={false}
            render={<Link href="/book" />}
          >
            Get My Fixed Price <ArrowRight aria-hidden="true" />
          </Button>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="landing-final-secondary">
            Prefer to talk? WhatsApp us <ArrowRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
