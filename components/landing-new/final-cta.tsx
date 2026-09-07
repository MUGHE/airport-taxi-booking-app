import Link from "next/link"
import { PlaneTakeoff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center lg:flex-row lg:justify-between lg:text-left">
        <div className="flex items-center gap-4">
          <PlaneTakeoff className="size-8 shrink-0 text-primary-foreground/80" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your journey starts with a fixed price.
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/70">
              Reliable airport transfers across London, 24/7.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            size="lg"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/book" />}
          >
            Get fixed price
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            nativeButton={false}
            render={<Link href="/track" />}
          >
            Track Booking
          </Button>
        </div>
      </div>
    </section>
  )
}
