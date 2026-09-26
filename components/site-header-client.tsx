"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import type { AirportDirectoryEntry } from "@/lib/airport-directory"

const NAV = [
  { href: "/#fleet", label: "Our Fleet" },
  { href: "/#how", label: "How It Works" },
  { href: "/track", label: "Track Booking" },
]

function AirportLinks({ airports, onNavigate }: { airports: AirportDirectoryEntry[]; onNavigate?: () => void }) {
  return <>
    {airports.map((airport) => <Link key={airport.id} href={`/airport-transfers/${airport.slug}`} onClick={onNavigate} className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">{airport.displayName} <span className="text-muted-foreground">({airport.iataCode})</span></Link>)}
    <Link href="/airport-transfers" onClick={onNavigate} className="mt-1 block border-t border-border px-3 py-2 text-sm font-medium text-primary">View all airports</Link>
  </>
}

function DesktopAirportNavigation({ airports }: { airports: AirportDirectoryEntry[] }) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground">
            Airports
          </NavigationMenuTrigger>
          <NavigationMenuContent className="w-[min(42rem,calc(100vw-2rem))] p-2">
            <div className="grid grid-cols-3 gap-1">
              {airports.map((airport) => (
                <NavigationMenuLink
                  key={airport.id}
                  render={<Link href={`/airport-transfers/${airport.slug}`} />}
                  className="block"
                >
                  {airport.displayName} <span className="text-muted-foreground">({airport.iataCode})</span>
                </NavigationMenuLink>
              ))}
            </div>
            <NavigationMenuLink
              render={<Link href="/airport-transfers" />}
              className="mt-1 border-t border-border pt-3 font-medium text-primary"
            >
              View all airports
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export function SiteHeaderClient({ airports }: { airports: AirportDirectoryEntry[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold"><Image src="/brand/logo-mark.png" alt="ONE Airport Taxi" width={40} height={40} className="size-10" /><span className="text-lg tracking-tight">ONE Airport Taxi</span></Link>
        <nav className="hidden items-center gap-1 md:flex">
          <DesktopAirportNavigation airports={airports} />
          <Link href="/destinations" className={cn(navigationMenuTriggerStyle(), "text-muted-foreground hover:text-foreground", pathname === "/destinations" && "text-foreground")}>Destinations</Link>
          {NAV.map((item) => <Link key={item.href} href={item.href} className={cn(navigationMenuTriggerStyle(), "text-muted-foreground hover:text-foreground", pathname === item.href && "text-foreground")}>{item.label}</Link>)}
        </nav>
        <div className="hidden md:block"><Button nativeButton={false} render={<Link href="/book" />}>Book a Ride</Button></div>
        <button type="button" aria-label="Toggle menu" className="inline-flex size-9 items-center justify-center rounded-md text-foreground md:hidden" onClick={() => setOpen((value) => !value)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {open && <div className="border-t border-border/60 bg-background md:hidden"><nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3"><details className="rounded-md"><summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Airports</summary><div className="ml-3 border-l border-border pl-3"><AirportLinks airports={airports} onNavigate={() => setOpen(false)} /></div></details><Link href="/destinations" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Destinations</Link>{NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">{item.label}</Link>)}<Button className="mt-2" nativeButton={false} render={<Link href="/book" onClick={() => setOpen(false)} />}>Book a Ride</Button></nav></div>}
    </header>
  )
}
