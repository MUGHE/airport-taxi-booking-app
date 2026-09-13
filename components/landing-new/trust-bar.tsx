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
    <section className="landing-trust" aria-label="Why book with us">
      <div className="landing-container landing-trust-grid">
        {ITEMS.map((item, index) => (
          <div key={item.title} className="landing-trust-item">
            <span className="landing-trust-icon">
              <item.icon aria-hidden="true" />
            </span>
            <div>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
