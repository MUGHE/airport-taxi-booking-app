import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing.")
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}

export interface StripePaymentDetails {
  cardBrand?: string
  cardLast4?: string
  receiptUrl?: string
  /** Stripe's own receipt number for the charge (e.g. "2761-2527-0064"), distinct from our booking reference. */
  receiptNumber?: string
  amountReceived?: number
  currency?: string
}

/** Looks up the card and receipt details for a completed online payment, for display on invoices. Returns null if Stripe isn't configured or the lookup fails — callers should degrade gracefully rather than block on it. */
export async function getStripePaymentDetails(paymentIntentId: string): Promise<StripePaymentDetails | null> {
  try {
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.payment_method_details"],
    })
    const charge = typeof paymentIntent.latest_charge === "string" ? null : paymentIntent.latest_charge
    const card = charge?.payment_method_details?.card

    return {
      cardBrand: card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : undefined,
      cardLast4: card?.last4 ?? undefined,
      receiptUrl: charge?.receipt_url ?? undefined,
      receiptNumber: charge?.receipt_number ?? undefined,
      amountReceived: paymentIntent.amount_received / 100,
      currency: paymentIntent.currency,
    }
  } catch (error) {
    console.error("Failed to retrieve Stripe payment details:", error)
    return null
  }
}
