"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"
import { ROUTE_FAQ_LIMIT, ROUTE_PRICE_LIMIT, ROUTE_TEXT_LIMITS, reverseRouteSlug } from "@/lib/route-page-content"
import { ROUTE_PAGES_TAG, deleteRoutePage, saveRoutePage, setRoutePageStatus, type AdminRoutePage } from "@/lib/route-pages"
import { isAdminAuthenticated } from "@/lib/session"

// Every action re-checks the signed-in admin on the server; the editor UI is never trusted.

const NOT_AUTHORIZED = { ok: false as const, error: "Not authorized." }

const text = (max: number, label: string) => z.string().max(max, `${label} can be at most ${max} characters.`)

const routeInputSchema = z.object({
  id: z.string().uuid().optional(),
  endpointAId: z.string().uuid("Choose the first place."),
  endpointBId: z.string().uuid("Choose the second place."),
  slug: z.string().trim().refine((value) => reverseRouteSlug(value) !== null && value.length <= 120, "The URL must look like heathrow-to-birmingham-taxi."),
  text: z.object({
    heading: text(ROUTE_TEXT_LIMITS.heading, "The heading"),
    intro: text(ROUTE_TEXT_LIMITS.intro, "The introduction"),
    aToBText: text(ROUTE_TEXT_LIMITS.aToBText, "This text"),
    bToAText: text(ROUTE_TEXT_LIMITS.bToAText, "This text"),
    seoTitle: text(ROUTE_TEXT_LIMITS.seoTitle, "The SEO title"),
    seoDescription: text(ROUTE_TEXT_LIMITS.seoDescription, "The SEO description"),
    faqs: z.array(z.object({ question: text(ROUTE_TEXT_LIMITS.faqQuestion, "A question"), answer: text(ROUTE_TEXT_LIMITS.faqAnswer, "An answer") })).max(ROUTE_FAQ_LIMIT, `Add at most ${ROUTE_FAQ_LIMIT} questions.`),
  }),
  prices: z.array(z.object({
    vehicleId: z.string().max(60),
    label: text(ROUTE_TEXT_LIMITS.priceLabel, "A price name"),
    price: z.number({ message: "Enter a price in pounds." }).positive("A price must be more than £0.").max(100000, "That price is too high."),
    note: text(ROUTE_TEXT_LIMITS.priceNote, "A price note"),
  })).max(ROUTE_PRICE_LIMIT, `Add at most ${ROUTE_PRICE_LIMIT} prices.`),
  distanceMiles: z.number().positive("Distance must be more than 0.").max(2000).nullable(),
  durationMinutes: z.number().int("Use whole minutes.").positive("Time must be more than 0.").max(3000).nullable(),
})

/** The change is already saved at this point, so a failed cache refresh is logged rather than reported as a failed save. */
function refreshRoutes(...slugs: (string | null | undefined)[]) {
  try {
    updateTag(ROUTE_PAGES_TAG)
    // Route pages are built at /route-pages/[slug] and served at /[slug] (see next.config.mjs).
    for (const slug of slugs) if (slug) revalidatePath(`/route-pages/${slug}`)
    revalidatePath("/sitemap.xml")
    revalidatePath("/routes")
    revalidatePath("/admin/route-pages")
  } catch (error) {
    console.error("Route page cache refresh failed", error)
  }
}

async function guarded<T>(name: string, message: string, run: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await run()
  } catch (error) {
    console.error(`Route page action failed: ${name}`, error)
    return { ok: false, error: message }
  }
}

export async function saveRoutePageAction(input: unknown): Promise<{ ok: true; route: AdminRoutePage; distanceFound: boolean } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  return guarded("save", "The route page could not be saved. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const parsed = routeInputSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message
      return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors }
    }
    const result = await saveRoutePage(parsed.data)
    if (result.ok) refreshRoutes(result.route.slug, result.route.reverseSlug)
    return result
  })
}

export async function setRoutePageStatusAction(id: string, status: "draft" | "published"): Promise<{ ok: true; route: AdminRoutePage } | { ok: false; error: string }> {
  return guarded("status", "The status could not be changed. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    if (typeof id !== "string" || (status !== "draft" && status !== "published")) return { ok: false as const, error: "Invalid request." }
    const result = await setRoutePageStatus(id, status)
    if (result.ok) refreshRoutes(result.route.slug, result.route.reverseSlug)
    return result
  })
}

export async function deleteRoutePageAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return guarded("delete", "The route page could not be deleted. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    if (typeof id !== "string") return { ok: false as const, error: "Invalid request." }
    const result = await deleteRoutePage(id)
    if (!result.ok) return result
    refreshRoutes(result.slug, result.slug ? reverseRouteSlug(result.slug) : null)
    return { ok: true as const }
  })
}
