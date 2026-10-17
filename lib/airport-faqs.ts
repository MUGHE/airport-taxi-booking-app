import { createClient } from "@supabase/supabase-js"
import { DEFAULT_GLOBAL_FAQS, type GlobalFaq } from "@/lib/reusable-content"

export type AdminAirportFaq = GlobalFaq & { approved: boolean; updatedAt: string }

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Makes the shared airport FAQs specific to one airport page, so questions name the airport
 *  ("Where will my driver meet me at Luton Airport?") on the page and in its FAQ schema. */
export function localizeAirportFaqs<T extends { question: string; answer: string }>(faqs: T[], airportName: string, singleTerminal: boolean): { question: string; answer: string }[] {
  const airport = `${airportName} Airport`
  const localized = faqs.map((faq) => ({
    question: faq.question
      .replace(/\bat the airport\b/gi, `at ${airport}`)
      .replace(/\bmy flight is\b/gi, `my flight to ${airportName} is`)
      .replace(/\ban airport transfer\b/gi, `a ${airport} transfer`)
      .replace(/\bmy airport transfer\b/gi, `my ${airport} transfer`)
      .replace(/\ban airport pickup\b/gi, `a ${airport} pickup`),
    answer: faq.answer,
  }))
  if (!singleTerminal) return localized
  return [...localized, {
    question: `Does ${airport} have more than one terminal?`,
    answer: `No. ${airport} has a single terminal, so there is one meeting point and no terminal to choose when you book.`,
  }]
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
