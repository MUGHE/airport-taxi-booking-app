import Link from "next/link"
import { ArrowRight, Check, PlaneTakeoff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section className="landing-final-wrap">
      <div className="landing-container landing-final-cta">
        <div className="landing-final-copy">
          <span className="landing-eyebrow landing-eyebrow-light">Ready when you are</span>
          <h2>Your journey should feel easy before it even begins.</h2>
          <p>Book your London airport transfer today and know exactly who is meeting you, where, and for how much.</p>
          <div className="landing-final-points">
            <span><Check aria-hidden="true" /> Fixed fare</span>
            <span><Check aria-hidden="true" /> Flight tracking</span>
            <span><Check aria-hidden="true" /> 24/7 support</span>
          </div>
        </div>
        <div className="landing-final-action">
          <span className="landing-final-icon"><PlaneTakeoff aria-hidden="true" /></span>
          <h3>One less thing to think about.</h3>
          <p>Enter your route and see your fixed price in moments.</p>
          <Button
            size="lg"
            className="bg-white text-[#071d33] hover:bg-sky-50"
            nativeButton={false}
            render={<Link href="/book" />}
          >
            Get your fixed price <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}
