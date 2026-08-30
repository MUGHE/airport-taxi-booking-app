import { Resend } from "resend"
import type { Booking } from "./types"
import { COMPANY_EMAIL, COMPANY_NAME } from "./company"
import { getStripePaymentDetails } from "./stripe"

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null

  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }

  return resendClient
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

// Every field below can originate from a public, unauthenticated booking form (or be posted
// directly to the Server Action, bypassing the UI entirely), so anything customer-supplied
// must be escaped before it's interpolated into an HTML email — otherwise a booking could
// carry markup/links that render as if sent by us, to the customer's own inbox or to staff.
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      case "'": return "&#39;"
      default: return char
    }
  })
}

function bookingSummaryRows(booking: Booking, appUrl: string): string {
  const linkedReference = booking.returnTripReference || booking.outboundTripReference
  const rows: Array<[string, string]> = [
    ["Reference", booking.reference],
    ["Pickup", `${booking.pickupDate} at ${booking.pickupTime}`],
    ["From", escapeHtml(booking.pickupAddress || booking.airportId)],
    ["To", escapeHtml(booking.dropoffAddress || booking.destinationAddress)],
    ...(booking.stops.length > 0 ? [["Stops", `${escapeHtml(booking.stops.map((s) => s.address).join(", "))} (+${formatCurrency(booking.stopsTotal)})`] as [string, string]] : []),
    ["Vehicle", booking.vehicleId],
    ["Passengers", String(booking.passengers)],
    ["Bags", String(booking.bags)],
    ["Flight number", booking.flightNumber ? escapeHtml(booking.flightNumber) : "—"],
    ...(booking.promoCode && booking.discountAmount > 0 ? [["Promo code", `${booking.promoCode} (-${formatCurrency(booking.discountAmount)})`] as [string, string]] : []),
    ["Fare", formatCurrency(booking.fare)],
    ["Payment", booking.paymentMethod === "cash" ? "Cash to driver" : "Card (online)"],
    ...(linkedReference
      ? [[
          booking.returnTripReference ? "Return trip" : "Outbound trip",
          appUrl ? `<a href="${appUrl}/booking/${linkedReference}" style="color:#2563eb;">${linkedReference}</a>` : linkedReference,
        ] as [string, string]]
      : []),
  ]

  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;">${label}</td><td style="padding:6px 0;font-weight:600;color:#111827;">${value}</td></tr>`,
    )
    .join("")
}

async function getAppUrl(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "")
  return ""
}

export async function sendBookingNotificationEmails(booking: Booking): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY is not set; skipping booking confirmation emails.")
    return
  }

  const fromAddress = process.env.EMAIL_FROM || "Airport Taxi <onboarding@resend.dev>"
  const supportEmail = process.env.SUPPORT_EMAIL
  const appUrl = await getAppUrl()
  const trackingUrl = appUrl ? `${appUrl}/booking/${booking.reference}` : undefined
  const summaryRows = bookingSummaryRows(booking, appUrl)

  const customerHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;">Booking confirmed</h2>
      <p style="color:#374151;">Hi ${escapeHtml(booking.customerName)}, thanks for booking with us! Here are your trip details:</p>
      <table style="border-collapse:collapse;width:100%;">${summaryRows}</table>
      ${
        booking.paymentMethod === "cash"
          ? `<p style="color:#374151;margin-top:16px;">Please have <strong>${formatCurrency(booking.fare)}</strong> in cash ready for your driver at the end of the journey.</p>`
          : ""
      }
      ${trackingUrl ? `<p style="margin-top:16px;"><a href="${trackingUrl}" style="color:#2563eb;">View or manage your booking</a></p>` : ""}
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">If you have any questions, just reply to this email.</p>
    </div>
  `

  const supportHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;">New booking received</h2>
      <table style="border-collapse:collapse;width:100%;">${summaryRows}</table>
      <table style="border-collapse:collapse;width:100%;margin-top:12px;">
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Customer</td><td style="padding:6px 0;font-weight:600;color:#111827;">${escapeHtml(booking.customerName)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;font-weight:600;color:#111827;">${escapeHtml(booking.email)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;font-weight:600;color:#111827;">${escapeHtml(booking.phone)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Notes</td><td style="padding:6px 0;font-weight:600;color:#111827;">${booking.notes ? escapeHtml(booking.notes) : "—"}</td></tr>
      </table>
      ${trackingUrl ? `<p style="margin-top:16px;"><a href="${trackingUrl}" style="color:#2563eb;">View booking</a></p>` : ""}
    </div>
  `

  const sends: Array<Promise<unknown>> = [
    resend.emails.send({
      from: fromAddress,
      to: booking.email,
      subject: `Booking confirmed — ${booking.reference}`,
      html: customerHtml,
    }),
  ]

  if (supportEmail) {
    sends.push(
      resend.emails.send({
        from: fromAddress,
        to: supportEmail,
        subject: `New booking — ${booking.reference}`,
        html: supportHtml,
      }),
    )
  } else {
    console.warn("SUPPORT_EMAIL is not set; skipping the support notification email.")
  }

  const results = await Promise.allSettled(sends)
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send booking email:", result.reason)
    }
  }
}

/** Sent to the customer whenever support edits a booking from the admin panel (location, add-ons, vehicle, etc.) so the new price and details are never a surprise. */
export async function sendBookingUpdateEmail(booking: Booking): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY is not set; skipping booking update email.")
    return
  }

  const fromAddress = process.env.EMAIL_FROM || "Airport Taxi <onboarding@resend.dev>"
  const appUrl = await getAppUrl()
  const trackingUrl = appUrl ? `${appUrl}/booking/${booking.reference}` : undefined
  const summaryRows = bookingSummaryRows(booking, appUrl)

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#111827;">Your booking has been updated</h2>
      <p style="color:#374151;">Hi ${escapeHtml(booking.customerName)}, one of our team has updated your booking. Here are your current trip details:</p>
      <table style="border-collapse:collapse;width:100%;">${summaryRows}</table>
      ${
        booking.paymentMethod === "cash"
          ? `<p style="color:#374151;margin-top:16px;">Please have <strong>${formatCurrency(booking.fare)}</strong> in cash ready for your driver at the end of the journey.</p>`
          : `<p style="color:#374151;margin-top:16px;">If this change affects the amount owed, our team will follow up separately about payment.</p>`
      }
      ${trackingUrl ? `<p style="margin-top:16px;"><a href="${trackingUrl}" style="color:#2563eb;">View or manage your booking</a></p>` : ""}
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">If anything here looks wrong, just reply to this email.</p>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: booking.email,
      subject: `Booking updated — ${booking.reference}`,
      html,
    })
    if (result.error) {
      console.error("Failed to send booking update email:", result.error)
    }
  } catch (error) {
    console.error("Failed to send booking update email:", error)
  }
}

function invoiceLineItems(booking: Booking): Array<[string, number]> {
  // The booking only stores the final fare plus the individual add-on/stop/discount
  // amounts, so the base vehicle fare is recovered by working backwards from those.
  const vehicleFare = booking.fare + booking.discountAmount - booking.addOnsTotal - booking.stopsTotal

  const items: Array<[string, number]> = [[`Vehicle fare (${booking.vehicleId})`, vehicleFare]]
  if (booking.stops.length > 0) {
    items.push([`Extra stop${booking.stops.length > 1 ? "s" : ""} (${booking.stops.length})`, booking.stopsTotal])
  }
  for (const addOn of booking.addOns) {
    items.push([addOn.name, addOn.price])
  }
  if (booking.promoCode && booking.discountAmount > 0) {
    items.push([`Discount (${booking.promoCode})`, -booking.discountAmount])
  }
  return items
}

function formatLongDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

/**
 * Sent to the customer on demand from the admin panel — a Stripe-receipt-style summary of
 * what a booking cost, who it's from, and how (or whether) it's been paid. Online card
 * payments pull their card/receipt details live from Stripe; cash bookings get the same
 * layout with "due" language instead, since cash is settled with the driver, not us.
 */
export async function sendInvoiceEmail(booking: Booking): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    const error = "RESEND_API_KEY is not set; can't send invoice emails."
    console.warn(error)
    return { ok: false, error }
  }

  const fromAddress = process.env.EMAIL_FROM || "Airport Taxi <onboarding@resend.dev>"
  const appUrl = await getAppUrl()
  const trackingUrl = appUrl ? `${appUrl}/booking/${booking.reference}` : undefined
  const logoUrl = appUrl ? `${appUrl}/brand/logo-mark.png` : undefined

  const isPaid = booking.paymentStatus === "paid"
  const isCash = booking.paymentMethod === "cash"

  // Online (card) payments settle through Stripe, so pull the card/receipt details from
  // there rather than trying to keep our own copy in sync. Best-effort — a lookup failure
  // (or Stripe not configured) just falls back to the generic "Card" label instead of
  // blocking the invoice.
  const stripeDetails =
    !isCash && booking.stripePaymentIntentId ? await getStripePaymentDetails(booking.stripePaymentIntentId) : null

  const statusLine = isPaid
    ? `Paid ${formatLongDate(booking.paidAt || booking.createdAt)}`
    : isCash
      ? `Due in cash — ${formatLongDate(booking.pickupDate)}`
      : "Payment due"

  const paymentMethodLabel = isCash
    ? "Cash to driver"
    : stripeDetails?.cardBrand && stripeDetails?.cardLast4
      ? `${stripeDetails.cardBrand} •••• ${stripeDetails.cardLast4}`
      : "Card"

  const itemizedHeading = isPaid && stripeDetails?.receiptNumber ? `Receipt #${stripeDetails.receiptNumber}` : `Invoice #${booking.reference}`

  const itemRows = invoiceLineItems(booking)
    .map(
      ([label, amount]) =>
        `<tr><td style="padding:8px 0;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">${label}</td><td style="padding:8px 0;text-align:right;font-size:14px;font-weight:500;color:#111827;border-bottom:1px solid #e5e7eb;">${formatCurrency(amount)}</td></tr>`,
    )
    .join("")

  const html = `
    <div style="background:#f6f6f7;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;">
        <div style="margin-bottom:20px;">
          ${logoUrl ? `<img src="${logoUrl}" width="28" height="28" style="vertical-align:middle;border-radius:6px;margin-right:10px;" alt="" />` : ""}
          <span style="font-size:16px;font-weight:600;color:#111827;vertical-align:middle;">${COMPANY_NAME}</span>
        </div>

        <div style="background:#ffffff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin-bottom:16px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${isPaid ? "Receipt from" : "Invoice from"} ${COMPANY_NAME}</p>
          <p style="margin:0;font-size:34px;font-weight:600;color:#111827;">${formatCurrency(booking.fare)}</p>
          <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">${statusLine}</p>
          <div style="border-top:1px solid #e5e7eb;margin:20px 0 14px;"></div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Invoice number</td><td style="padding:4px 0;text-align:right;font-size:13px;font-weight:500;color:#111827;">${booking.reference}</td></tr>
            ${
              stripeDetails?.receiptNumber
                ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Receipt number</td><td style="padding:4px 0;text-align:right;font-size:13px;font-weight:500;color:#111827;">${stripeDetails.receiptNumber}</td></tr>`
                : ""
            }
            <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Payment method</td><td style="padding:4px 0;text-align:right;font-size:13px;font-weight:500;color:#111827;">${paymentMethodLabel}</td></tr>
          </table>
        </div>

        <div style="background:#ffffff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111827;">${itemizedHeading}</p>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">${formatLongDate(booking.pickupDate)} at ${booking.pickupTime}</p>
          <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
          <table style="width:100%;border-collapse:collapse;margin-top:4px;">
            <tr><td style="padding:10px 0 2px;font-size:14px;font-weight:600;color:#111827;">Total</td><td style="padding:10px 0 2px;text-align:right;font-size:14px;font-weight:600;color:#111827;">${formatCurrency(booking.fare)}</td></tr>
            <tr><td style="padding:2px 0;font-size:14px;color:#111827;">${isPaid ? "Amount paid" : "Amount due"}</td><td style="padding:2px 0;text-align:right;font-size:14px;color:#111827;">${formatCurrency(booking.fare)}</td></tr>
          </table>
          <div style="border-top:1px solid #e5e7eb;margin:16px 0 12px;"></div>
          <p style="margin:0;font-size:13px;color:#6b7280;">Questions? Contact us at <a href="mailto:${COMPANY_EMAIL}" style="color:#2563eb;text-decoration:none;font-weight:500;">${COMPANY_EMAIL}</a>.</p>
        </div>

        ${stripeDetails?.receiptUrl ? `<p style="text-align:center;margin:16px 0 0;font-size:13px;"><a href="${stripeDetails.receiptUrl}" style="color:#2563eb;">View Stripe receipt</a></p>` : ""}
        ${trackingUrl ? `<p style="text-align:center;margin:12px 0 0;font-size:13px;"><a href="${trackingUrl}" style="color:#2563eb;">View or manage your booking</a></p>` : ""}
      </div>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: booking.email,
      subject: `${isPaid ? "Receipt" : "Invoice"} — ${booking.reference}`,
      html,
    })
    if (result.error) {
      console.error("Failed to send invoice email:", result.error)
      return { ok: false, error: "Resend rejected the invoice email." }
    }
    return { ok: true }
  } catch (error) {
    console.error("Failed to send invoice email:", error)
    return { ok: false, error: "Unexpected error sending the invoice email." }
  }
}
