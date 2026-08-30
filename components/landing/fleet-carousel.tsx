"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Briefcase, Check, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/fleet"
import type { VehicleClass } from "@/lib/types"
import { cn } from "@/lib/utils"

const EDGE_FADE = 40

export function FleetCarousel({ vehicles }: { vehicles: VehicleClass[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateScrollState() {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    updateScrollState()
    const el = trackRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles.length])

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-card]")
    const gap = 24 // gap-6
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.8
    el.scrollBy({ left: direction * step, behavior: "smooth" })
  }

  // Only fade an edge the user can actually still scroll toward — otherwise the very
  // first/last card would look cut off with nothing left to reveal.
  const maskImage = `linear-gradient(to right, ${
    canScrollLeft ? `transparent, black ${EDGE_FADE}px` : "black 0px"
  }, ${canScrollRight ? `black calc(100% - ${EDGE_FADE}px), transparent` : "black 100%"})`

  return (
    <div className="relative mt-12">
      <div
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-3 sm:mx-0 sm:px-0"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        {vehicles.map((v, index) => (
          <div
            key={v.id}
            data-card
            className="animate-card-in hover-lift flex w-[calc(100vw-2rem)] max-w-sm shrink-0 snap-start snap-always flex-col overflow-hidden rounded-2xl border border-border/70 bg-background sm:w-72 sm:max-w-none"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="relative aspect-[4/3] bg-secondary">
              <Image
                src={v.image || "/placeholder.svg"}
                alt={v.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80vw, 288px"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{v.name}</h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    from {formatCurrency(v.minFare)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {v.description}
                </p>

                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" /> {v.capacity}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {v.luggage}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {v.features.slice(0, 3).map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="outline"
                className="mt-5 w-full"
                nativeButton={false}
                render={<Link href={`/book?vehicle=${v.id}`} />}
              >
                Select {v.name}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollLeft}
        aria-label="Scroll to previous vehicles"
        className={cn(
          "absolute left-1 top-[108px] z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-md backdrop-blur transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-0 sm:flex",
        )}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        disabled={!canScrollRight}
        aria-label="Scroll to next vehicles"
        className={cn(
          "absolute right-1 top-[108px] z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-md backdrop-blur transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-0 sm:flex",
        )}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
