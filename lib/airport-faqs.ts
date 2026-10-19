import { createClient } from "@supabase/supabase-js"
import { DEFAULT_GLOBAL_FAQS, type GlobalFaq } from "@/lib/reusable-content"

export type AdminAirportFaq = GlobalFaq & { approved: boolean; updatedAt: string }

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export type AirportPageFaq = { question: string; answer: string; link?: { href: string; label: string } }

/** The FAQs shown on every airport page (and in its FAQPage schema), named for that airport.
 *  Fees here (meet & greet, extra waiting) are set by the business; keep the Terms in step. */
export function airportPageFaqs(airportName: string): AirportPageFaq[] {
  const airport = `${airportName} Airport`
  return [
    {
      question: `How do I book a ${airport} transfer with One Airport Taxi?`,
      answer: "You can book your airport transfer directly through our website by entering your pickup and drop-off details, travel date and time, and passenger and luggage requirements. You can request a quote and complete your booking online. We recommend booking in advance, especially for early-morning, late-night and busy travel periods.",
    },
    {
      question: "What does the price include?",
      answer: "Your quoted transfer fare includes airport pickup and drop-off charges, tolls, parking and congestion charges. Optional meet & greet costs £7 extra. Airport pickups include 60 minutes of free waiting from the actual landing time; additional waiting costs £15 per 30 minutes. Customer-requested changes may change the fare.",
      link: { href: "/terms", label: "See our terms and conditions" },
    },
    {
      question: `Where will my driver meet me at ${airport}?`,
      answer: `For airport pickups, you can find the pickup points at ${airport} in the pickup guide above. For home pickups, enter your door number and postcode in the pickup address field on this page.`,
    },
    {
      question: "What happens if my flight is delayed or arrives early?",
      answer: "We monitor your flight once flight details are provided, to track any delays or changes to the scheduled arrival time. Your driver can adjust the pickup accordingly to help avoid unnecessary waiting or missed pickups. Please make sure your correct flight number is included with your booking.",
    },
    {
      question: `Can I book a ${airport} transfer for someone else?`,
      answer: "Yes. You can make a booking on behalf of another passenger. We provide airport transfers for colleagues, employees, students, corporate travellers, family members and other guests. Please provide the passenger's correct name, contact details and travel information when making the booking.",
    },
    {
      question: `Can I change or cancel my ${airport} transfer?`,
      answer: "Yes, you can contact us if you need to make changes to your booking. Cancellation terms depend on how much notice is given before the scheduled pickup time. We recommend contacting us as soon as possible if your plans change, so we can confirm the available options and any applicable refund.",
    },
  ]
}

function toAdminFaq(row: { id: string; question: string; answer: string; approved: boolean; updated_at: string }): AdminAirportFaq {
  return { id: row.id, question: row.question, answer: row.answer, approved: row.approved, updatedAt: row.updated_at }
}

export async function listAirportFaqs(): Promise<GlobalFaq[]> {
  const supabase = getSupabase()
  if (!supabase) return DEFAULT_GLOBAL_FAQS

  const { data, error } = await supabase
    .from("airport_faqs")
    .select("id, question, answer")
    .eq("approved", true)
    .order("sort_order", { ascending: true })

  if (error) return DEFAULT_GLOBAL_FAQS
  return (data ?? []) as GlobalFaq[]
}

export async function listAdminAirportFaqs(): Promise<AdminAirportFaq[]> {
  const supabase = getSupabase()
  if (!supabase) return DEFAULT_GLOBAL_FAQS.map((faq) => ({ ...faq, approved: true, updatedAt: "" }))

  const { data, error } = await supabase
    .from("airport_faqs")
    .select("id, question, answer, approved, updated_at")
    .order("updated_at", { ascending: false })

  if (error) return []
  return (data ?? []).map(toAdminFaq)
}

export async function saveAdminAirportFaq(input: { id?: string; question: string; answer: string }) {
  const supabase = getSupabase()
  if (!supabase) return { ok: false as const, error: "Database is not connected." }

  const question = input.question.trim()
  const answer = input.answer.trim()
  if (!question || !answer) return { ok: false as const, error: "Question and answer are required." }

  const query = input.id
    ? supabase.from("airport_faqs").update({ question, answer, approved: true, updated_at: new Date().toISOString() }).eq("id", input.id).select("id, question, answer, approved, updated_at").single()
    : supabase.from("airport_faqs").insert({ question, answer, approved: true }).select("id, question, answer, approved, updated_at").single()
  const { data, error } = await query
  if (error || !data) return { ok: false as const, error: error?.message || "Could not save the FAQ." }
  return { ok: true as const, faq: toAdminFaq(data) }
}

export async function deleteAdminAirportFaq(id: string) {
  const supabase = getSupabase()
  if (!supabase) return { ok: false as const, error: "Database is not connected." }
  if (!id) return { ok: false as const, error: "FAQ not found." }

  const { error } = await supabase.from("airport_faqs").delete().eq("id", id)
  return error ? { ok: false as const, error: error.message } : { ok: true as const }
}
