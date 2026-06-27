import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready when your flight lands
          </h2>
          <p className="mt-3 text-pretty text-primary-foreground/80">
            Book your next airport transfer in under a minute and travel with total
            peace of mind.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/book">
                Book a Ride
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/track">Track an Existing Booking</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
