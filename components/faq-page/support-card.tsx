import { Mail, MessageCircle, Phone } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { CALL_LINK, CALL_NUMBER, CONTACT_EMAIL, EMAIL_LINK, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/contact"
import { cn } from "@/lib/utils"

// "Still have questions?" card with call, WhatsApp and email buttons, closing /faqs.
export function SupportCard() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 lg:pb-20" aria-labelledby="still-questions">
      <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 id="still-questions" className="text-2xl font-semibold tracking-tight">Still have questions?</h2>
          <p className="mt-2 text-muted-foreground">
            Our support team is available 24/7 to assist you with bookings, changes, or special requests.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <a href={CALL_LINK} className={cn(buttonVariants({ size: "lg" }), "h-auto flex-col gap-0.5 py-3")}>
            <span className="flex items-center gap-2"><Phone aria-hidden="true" className="size-4" /> Call us</span>
            <span className="text-xs font-normal opacity-85">{CALL_NUMBER}</span>
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-auto flex-col gap-0.5 py-3")}>
            <span className="flex items-center gap-2"><MessageCircle aria-hidden="true" className="size-4" /> WhatsApp</span>
            <span className="text-xs font-normal text-muted-foreground">+{WHATSAPP_NUMBER.replace(/^\+/, "")}</span>
          </a>
          <a href={EMAIL_LINK} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-auto flex-col gap-0.5 py-3")}>
            <span className="flex items-center gap-2"><Mail aria-hidden="true" className="size-4" /> Email</span>
            <span className="text-xs font-normal text-muted-foreground">{CONTACT_EMAIL}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
