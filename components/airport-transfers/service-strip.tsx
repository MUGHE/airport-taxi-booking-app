import { Banknote, Headphones, Plane, UserRound } from "lucide-react"

const ITEMS = [
  { icon: Banknote, title: "Fixed price", text: "Agreed before booking" },
  { icon: Plane, title: "Flight tracking", text: "Adapts to delays" },
  { icon: UserRound, title: "Meet & greet", text: "At arrivals" },
  { icon: Headphones, title: "Local support", text: "24/7" },
]

export function ServiceStrip() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:py-14">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          The same reliable service, whichever airport you choose
        </h2>
        <div className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {ITEMS.map((item, index) => (
            <div
              key={item.title}
              className={`flex items-center gap-3 text-center sm:justify-center lg:px-6 ${
                index > 0 ? "lg:border-l lg:border-background/25" : ""
              }`}
            >
              <item.icon className="size-7 shrink-0 text-background/90" />
              <div className="text-left">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-background/70">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
