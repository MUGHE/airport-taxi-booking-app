import { Banknote, Handshake, Headset, Lock, ShieldCheck } from "lucide-react"

const ITEMS = [
  { icon: Banknote, title: "Fixed fares", text: "No meters, no surge" },
  { icon: Handshake, title: "Meet & greet", text: "Add it when you book" },
  { icon: ShieldCheck, title: "Licensed drivers", text: "Licensed and vetted" },
  { icon: Headset, title: "24/7 support", text: "Phone or WhatsApp" },
  { icon: Lock, title: "Secure payment", text: "Pay securely by card" },
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
