import { Resend } from "resend"
import type { Booking } from "./types"

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

function bookingSummaryRows(booking: Booking, appUrl: string): string {
  const linkedReference = booking.returnTripReference || booking.outboundTripReference
  const rows: Array<[string, string]> = [
    ["Reference", booking.reference],
    ["Pickup", `${booking.pickupDate} at ${booking.pickupTime}`],
    ["From", booking.pickupAddress || booking.airportId],
    ["To", booking.dropoffAddress || booking.destinationAddress],
    ...(booking.stops.length > 0 ? [["Stops", `${booking.stops.map((s) => s.address).join(", ")} (+${formatCurrency(booking.stopsTotal)})`] as [string, string]] : []),
    ["Vehicle", booking.vehicleId],
    ["Passengers", String(booking.passengers)],
    ["Bags", String(booking.bags)],
    ["Flight number", booking.flightNumber || "—"],
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
      <p style="color:#374151;">Hi ${booking.customerName}, thanks for booking with us! Here are your trip details:</p>
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
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Customer</td><td style="padding:6px 0;font-weight:600;color:#111827;">${booking.customerName}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;font-weight:600;color:#111827;">${booking.email}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;font-weight:600;color:#111827;">${booking.phone}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;">Notes</td><td style="padding:6px 0;font-weight:600;color:#111827;">${booking.notes || "—"}</td></tr>
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
      <p style="color:#374151;">Hi ${booking.customerName}, one of our team has updated your booking. Here are your current trip details:</p>
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
