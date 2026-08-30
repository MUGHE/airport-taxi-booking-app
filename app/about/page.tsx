import type { Metadata } from "next"
import Link from "next/link"
import { BadgeDollarSign, CarFront, Clock, Headset, MapPin, ShieldCheck, Star, Users } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CallToAction } from "@/components/landing/cta"
import { AIRPORTS } from "@/lib/fleet"

export const metadata: Metadata = {
  title: "About Us | ONE Airport Taxi",
  description:
    "ONE Airport Taxi provides fixed-price, professionally driven airport transfers across London — with flight tracking and 24/7 support on every trip.",
}

const STATS = [
  { icon: Users, value: "12,000+", label: "Travelers driven" },
  { icon: Star, value: "4.9/5", label: "Average rating" },
  { icon: MapPin, value: String(AIRPORTS.length), label: "London airports served" },
  { icon: Clock, value: "24/7", label: "Support & flight tracking" },
]

const VALUES = [
  {
    icon: BadgeDollarSign,
    title: "Transparency",
    text: "A fixed, all-inclusive fare is agreed before you travel — no surge pricing, no surprise charges on arrival.",
  },
  {
    icon: ShieldCheck,
    title: "Reliability",
    text: "Every chauffeur is background-checked, licensed and insured, and we track your flight so pickup adjusts automatically when plans change.",
  },
  {
    icon: CarFront,
    title: "Comfort",
    text: "A fleet ranging from saloon cars to 8-seat minibuses, so the vehicle fits your group and luggage — not the other way round.",
  },
  {
    icon: Headset,
    title: "Availability",
    text: "Real people on call around the clock, before and during every journey, for the moments plans don't go as booked.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-4 text-center lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Star className="size-3.5 fill-accent text-accent" />
            Rated 4.9/5 by 12,000+ travelers
          </span>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            About ONE Airport Taxi
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            We built ONE Airport Taxi around one idea: the ride to or from the airport
            should be the easiest part of your trip. Fixed prices, professional
            chauffeurs, and real flight tracking — booked in under a minute, every time.
          </p>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-card p-5 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </span>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              What we stand for
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              The same standard, on every airport transfer we run.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl border border-border/70 bg-card p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-10 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Have questions before you book? Our team is glad to help —{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              get in touch
            </Link>
            , or read our{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              booking terms
            </Link>
            .
          </p>
        </div>

        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}
