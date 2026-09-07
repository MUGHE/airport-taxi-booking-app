import { Banknote, Handshake, Headset, Lock, ShieldCheck } from "lucide-react"

const ITEMS = [
  { icon: Banknote, title: "Fixed price", text: "Know the price upfront" },
  { icon: Handshake, title: "Meet & greet", text: "At arrivals, we'll be there" },
  { icon: ShieldCheck, title: "Licensed drivers", text: "Professional and vetted" },
  { icon: Headset, title: "24/7 support", text: "Help whenever you need it" },
  { icon: Lock, title: "Secure payment", text: "Safe and encrypted" },
]

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:grid-cols-3 lg:grid-cols-5">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <item.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
