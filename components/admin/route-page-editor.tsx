"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowLeftRight, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { deleteRoutePageAction, saveRoutePageAction, setRoutePageStatusAction } from "@/lib/route-page-actions"
import {
  EMPTY_ROUTE_TEXT, ROUTE_FAQ_LIMIT, ROUTE_PRICE_LIMIT, ROUTE_WHY_LIMIT, ROUTE_TEXT_LIMITS,
  defaultDirectionText, defaultRouteFaqs, defaultRouteHeading, defaultRouteIntro, defaultRouteSeoDescription, defaultRouteSeoTitle, defaultWhyHeading, defaultWhyIntro, defaultWhyPoints,
  reverseRouteSlug, routeSlug,
  type RouteCustomText, type RouteEndpoint,
} from "@/lib/route-page-content"
import type { AdminRoutePage } from "@/lib/route-pages"

/** A price row while editing; the price stays text until it is saved. */
type PriceRow = { vehicleId: string; label: string; price: string; note: string }

type Form = { endpointAId: string; endpointBId: string; slug: string; text: RouteCustomText; prices: PriceRow[]; distanceMiles: string; durationMinutes: string }

function toForm(route?: AdminRoutePage): Form {
  return {
    endpointAId: route?.endpointAId ?? "",
    endpointBId: route?.endpointBId ?? "",
    slug: route?.slug ?? "",
    text: route?.text ?? EMPTY_ROUTE_TEXT,
    prices: (route?.prices ?? []).map((item) => ({ vehicleId: item.vehicleId, label: item.label, price: String(item.price), note: item.note })),
    distanceMiles: route?.distanceMiles != null ? String(route.distanceMiles) : "",
    durationMinutes: route?.durationMinutes != null ? String(route.durationMinutes) : "",
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-destructive" role="alert">{message}</p> : null
}

function CharCount({ value, max }: { value: string; max: number }) {
  return <span className={value.length > max ? "text-destructive" : "text-muted-foreground"}>{value.length}/{max}</span>
}

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

function EndpointSelect({ id, value, endpoints, exclude, onChange }: { id: string; value: string; endpoints: RouteEndpoint[]; exclude: string; onChange: (value: string) => void }) {
  const airports = endpoints.filter((endpoint) => endpoint.type === "airport")
  const places = endpoints.filter((endpoint) => endpoint.type === "place")
  return (
    <select id={id} className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choose a place…</option>
      <optgroup label="Airports">{airports.map((endpoint) => <option key={endpoint.id} value={endpoint.id} disabled={endpoint.id === exclude}>{endpoint.name}</option>)}</optgroup>
      {places.length > 0 && <optgroup label="Towns and cities">{places.map((endpoint) => <option key={endpoint.id} value={endpoint.id} disabled={endpoint.id === exclude}>{endpoint.name}</option>)}</optgroup>}
    </select>
  )
}

/** A text box whose empty value means "use the site's text", shown as the placeholder. */
function OptionalText({ id, label, value, max, fallback, rows, error, onChange }: { id: string; label: string; value: string; max: number; fallback: string; rows?: number; error?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3"><Label htmlFor={id}>{label}</Label><span className="text-xs"><CharCount value={value} max={max} /></span></div>
      {rows ? <Textarea id={id} rows={rows} value={value} placeholder={fallback} onChange={(event) => onChange(event.target.value)} /> : <Input id={id} value={value} placeholder={fallback} onChange={(event) => onChange(event.target.value)} />}
      <p className="text-xs text-muted-foreground">{value.trim() ? "Your text is used." : "Empty: the page uses the grey text in the box."}</p>
      <FieldError message={error} />
    </div>
  )
}

export function RoutePageEditor({ route: initialRoute, endpoints }: { route?: AdminRoutePage; endpoints: RouteEndpoint[] }) {
  const router = useRouter()
  const [route, setRoute] = useState(initialRoute)
  const [form, setForm] = useState<Form>(() => toForm(initialRoute))
  const [slugTouched, setSlugTouched] = useState(Boolean(initialRoute))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()

  const a = endpoints.find((endpoint) => endpoint.id === form.endpointAId)
  const b = endpoints.find((endpoint) => endpoint.id === form.endpointBId)
  const missingEndpoint = Boolean(route && (!a || !b))
  const distanceMiles = form.distanceMiles.trim() ? Number(form.distanceMiles) : null
  const durationMinutes = form.durationMinutes.trim() ? Number(form.durationMinutes) : null
  const facts = a && b ? { a, b, distanceMiles: Number.isFinite(distanceMiles) ? distanceMiles : null, durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null, fromFare: null } : null
  // The fare question needs a price; any number lists it here, as only the questions are shown.
  const autoFaqs = facts ? defaultRouteFaqs({ ...facts, fromFare: 0 }) : []
  const reverse = reverseRouteSlug(form.slug)

  function setEndpoints(endpointAId: string, endpointBId: string) {
    const nextA = endpoints.find((endpoint) => endpoint.id === endpointAId)
    const nextB = endpoints.find((endpoint) => endpoint.id === endpointBId)
    setForm((current) => ({ ...current, endpointAId, endpointBId, ...(!slugTouched && nextA && nextB ? { slug: routeSlug(nextA.slugPart, nextB.slugPart) } : {}) }))
    setErrors((current) => ({ ...current, endpointAId: "", endpointBId: "", slug: "" }))
    setDirty(true)
  }

  function updateText<K extends keyof RouteCustomText>(key: K, value: RouteCustomText[K]) {
    setForm((current) => ({ ...current, text: { ...current.text, [key]: value } }))
    setErrors((current) => ({ ...current, [`text.${key}`]: "" }))
    setDirty(true)
  }

  function updatePrices(prices: PriceRow[]) {
    setForm((current) => ({ ...current, prices }))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith("prices"))))
    setDirty(true)
  }

  function updatePrice(index: number, change: Partial<PriceRow>) {
    updatePrices(form.prices.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item))
  }

  function chooseVehicle(index: number, vehicleId: string) {
    const current = form.prices[index]
    const previous = VEHICLE_CLASSES.find((vehicle) => vehicle.id === current.vehicleId)
    const next = VEHICLE_CLASSES.find((vehicle) => vehicle.id === vehicleId)
    // The name follows the vehicle unless the admin has typed their own.
    const label = next && (!current.label.trim() || current.label === previous?.name) ? next.name : current.label
    updatePrice(index, { vehicleId, label })
  }

  function movePrice(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= form.prices.length) return
    const next = [...form.prices]
    ;[next[index], next[target]] = [next[target], next[index]]
    updatePrices(next)
  }

  function moveWhyPoint(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= form.text.whyPoints.length) return
    const next = [...form.text.whyPoints]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateText("whyPoints", next)
  }

  function save(after?: (saved: AdminRoutePage) => void) {
    startTransition(async () => {
      const result = await saveRoutePageAction({
        id: route?.id,
        endpointAId: form.endpointAId,
        endpointBId: form.endpointBId,
        slug: form.slug.trim(),
        text: form.text,
        // Rows with no name and no price are blank rows; anything else is checked on the server.
        prices: form.prices
          .filter((item) => item.label.trim() || item.price.trim())
          .map((item) => ({ vehicleId: item.vehicleId, label: item.label, price: item.price.trim() ? Number(item.price.replace(/[£,\s]/g, "")) : Number.NaN, note: item.note })),
        distanceMiles: form.distanceMiles.trim() ? Number(form.distanceMiles) : null,
        durationMinutes: form.durationMinutes.trim() ? Number(form.durationMinutes) : null,
      })
      if (!result.ok) {
        setErrors("fieldErrors" in result && result.fieldErrors ? result.fieldErrors : {})
        return void toast.error(result.error)
      }
      setRoute(result.route)
      setForm(toForm(result.route))
      setDirty(false)
      toast.success(result.distanceFound ? "Route page saved." : "Route page saved. Google Maps could not measure the drive, so enter the distance and time yourself.")
      if (!route) router.replace(`/admin/route-pages/${result.route.id}`)
      else router.refresh()
      after?.(result.route)
    })
  }

  function setStatus(status: "draft" | "published") {
    const run = (id: string) => startTransition(async () => {
      const result = await setRoutePageStatusAction(id, status)
      if (!result.ok) return void toast.error(result.error)
      setRoute(result.route)
      toast.success(status === "published" ? "Route page is live." : "Route page is hidden from the site.")
      router.refresh()
    })
    if (dirty || !route) save((saved) => run(saved.id))
    else run(route.id)
  }

  function remove() {
    if (!route || !window.confirm("Delete this route page? Its URL will stop working.")) return
    startTransition(async () => {
      const result = await deleteRoutePageAction(route.id)
      if (!result.ok) return void toast.error(result.error)
      toast.success("Route page deleted.")
      router.replace("/admin/route-pages")
    })
  }

  const published = route?.status === "published"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {route && <Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>}
        {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {published && route && <Button variant="outline" nativeButton={false} render={<Link href={`/${route.slug}`} target="_blank" />}><ExternalLink className="size-4" />View page</Button>}
          <Button variant="outline" disabled={pending} onClick={() => save()}>{pending && <Loader2 className="size-4 animate-spin" />}Save</Button>
          {published
            ? <Button variant="outline" disabled={pending} onClick={() => setStatus("draft")}>Unpublish</Button>
            : <Button disabled={pending || missingEndpoint} onClick={() => setStatus("published")}>Save and publish</Button>}
        </div>
      </div>

      {missingEndpoint && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">One of the places on this route no longer has a published page, so the route page is hidden. Publish that page again or choose another place.</p>}

      <Card>
        <CardHeader><CardTitle>Route</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">One page covers both directions. Only places with a published airport or destination page can be chosen.</p>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-1.5"><Label htmlFor="route-a">From</Label><EndpointSelect id="route-a" value={form.endpointAId} endpoints={endpoints} exclude={form.endpointBId} onChange={(value) => setEndpoints(value, form.endpointBId)} /><FieldError message={errors.endpointAId} /></div>
            <Button type="button" variant="ghost" size="icon" aria-label="Swap the two places" onClick={() => setEndpoints(form.endpointBId, form.endpointAId)}><ArrowLeftRight className="size-4" /></Button>
            <div className="space-y-1.5"><Label htmlFor="route-b">To</Label><EndpointSelect id="route-b" value={form.endpointBId} endpoints={endpoints} exclude={form.endpointAId} onChange={(value) => setEndpoints(form.endpointAId, value)} /><FieldError message={errors.endpointBId} /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="route-slug">Page URL</Label>
            <div className="flex items-center gap-1"><span className="text-sm text-muted-foreground">/</span><Input id="route-slug" value={form.slug} placeholder="heathrow-to-birmingham-taxi" onChange={(event) => { setSlugTouched(true); setDirty(true); setErrors((current) => ({ ...current, slug: "" })); setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() })) }} /></div>
            {reverse && <p className="text-xs text-muted-foreground">/{reverse} opens this same page.</p>}
            {route && route.slug !== form.slug.trim() && published && <p className="text-xs text-amber-700">Changing the URL of a live page breaks links to the old URL.</p>}
            <FieldError message={errors.slug} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="route-distance">Distance (miles)</Label><Input id="route-distance" inputMode="decimal" value={form.distanceMiles} placeholder="Filled from Google Maps" onChange={(event) => { setDirty(true); setForm((current) => ({ ...current, distanceMiles: event.target.value })) }} /><FieldError message={errors.distanceMiles} /></div>
            <div className="space-y-1.5"><Label htmlFor="route-duration">Driving time (minutes)</Label><Input id="route-duration" inputMode="numeric" value={form.durationMinutes} placeholder="Filled from Google Maps" onChange={(event) => { setDirty(true); setForm((current) => ({ ...current, durationMinutes: event.target.value })) }} /><FieldError message={errors.durationMinutes} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Leave these empty and Google Maps fills them when you save. They are shown on the page as the distance and driving time.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Prices</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Add a price for each car or quote you want on the page, in the order you want them shown. The same prices are shown for both directions. With no prices, the page shows no prices.</p>
          {form.prices.map((item, index) => {
            const label = `Price ${index + 1}`
            return (
              <div key={index} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => movePrice(index, -1)}><ArrowUp className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Move ${label} down`} disabled={index === form.prices.length - 1} onClick={() => movePrice(index, 1)}><ArrowDown className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={() => updatePrices(form.prices.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`route-price-vehicle-${index}`}>Vehicle (for the photo)</Label>
                    <select id={`route-price-vehicle-${index}`} className={selectClass} value={item.vehicleId} onChange={(event) => chooseVehicle(index, event.target.value)}>
                      <option value="">No photo</option>
                      {VEHICLE_CLASSES.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`route-price-label-${index}`}>Name</Label>
                    <Input id={`route-price-label-${index}`} value={item.label} maxLength={ROUTE_TEXT_LIMITS.priceLabel} placeholder="e.g. Saloon" onChange={(event) => updatePrice(index, { label: event.target.value })} />
                    <FieldError message={errors[`prices.${index}.label`]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`route-price-amount-${index}`}>Price (£)</Label>
                    <Input id={`route-price-amount-${index}`} inputMode="decimal" value={item.price} placeholder="120" onChange={(event) => updatePrice(index, { price: event.target.value })} />
                    <FieldError message={errors[`prices.${index}.price`]} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`route-price-note-${index}`}>Note (optional)</Label>
                  <Input id={`route-price-note-${index}`} value={item.note} maxLength={ROUTE_TEXT_LIMITS.priceNote} placeholder="e.g. Up to 4 passengers, one way" onChange={(event) => updatePrice(index, { note: event.target.value })} />
                </div>
              </div>
            )
          })}
          <FieldError message={errors.prices} />
          <Button type="button" variant="outline" disabled={form.prices.length >= ROUTE_PRICE_LIMIT} onClick={() => updatePrices([...form.prices, { vehicleId: "", label: "", price: "", note: "" }])}><Plus className="size-4" />Add price</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Page text</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {!facts ? <p className="text-sm text-muted-foreground">Choose both places to see the text the page will use.</p> : <>
            <OptionalText id="route-heading" label="Heading (H1)" value={form.text.heading} max={ROUTE_TEXT_LIMITS.heading} fallback={defaultRouteHeading(facts)} error={errors["text.heading"]} onChange={(value) => updateText("heading", value)} />
            <OptionalText id="route-intro" label="Introduction" rows={4} value={form.text.intro} max={ROUTE_TEXT_LIMITS.intro} fallback={defaultRouteIntro(facts)} error={errors["text.intro"]} onChange={(value) => updateText("intro", value)} />
            <OptionalText id="route-a-to-b" label={`${facts.a.name} to ${facts.b.name}`} rows={4} value={form.text.aToBText} max={ROUTE_TEXT_LIMITS.aToBText} fallback={defaultDirectionText(facts.a, facts.b)} error={errors["text.aToBText"]} onChange={(value) => updateText("aToBText", value)} />
            <OptionalText id="route-b-to-a" label={`${facts.b.name} to ${facts.a.name}`} rows={4} value={form.text.bToAText} max={ROUTE_TEXT_LIMITS.bToAText} fallback={defaultDirectionText(facts.b, facts.a)} error={errors["text.bToAText"]} onChange={(value) => updateText("bToAText", value)} />
          </>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Why Choose Us</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {!facts ? <p className="text-sm text-muted-foreground">Choose both places to see the text the page will use.</p> : <>
            <OptionalText id="route-why-heading" label="Heading" value={form.text.whyHeading} max={ROUTE_TEXT_LIMITS.whyHeading} fallback={defaultWhyHeading(facts)} error={errors["text.whyHeading"]} onChange={(value) => updateText("whyHeading", value)} />
            <OptionalText id="route-why-intro" label="Short introduction" rows={2} value={form.text.whyIntro} max={ROUTE_TEXT_LIMITS.whyIntro} fallback={defaultWhyIntro(facts)} error={errors["text.whyIntro"]} onChange={(value) => updateText("whyIntro", value)} />
            <div className="space-y-3">
              <p className="text-sm font-medium">Points</p>
              {form.text.whyPoints.length === 0 && <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground"><p>No points added, so the page shows these:</p><ul className="mt-2 list-disc space-y-1 pl-5">{defaultWhyPoints(facts).map((point) => <li key={point.title}>{point.title}</li>)}</ul><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => updateText("whyPoints", defaultWhyPoints(facts))}>Copy these to edit them</Button></div>}
              {form.text.whyPoints.map((point, index) => {
                const label = `Point ${index + 1}`
                return (
                  <div key={index} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <Input aria-label={`${label} title`} value={point.title} maxLength={ROUTE_TEXT_LIMITS.whyTitle} placeholder="Title, e.g. Fixed fares" onChange={(event) => updateText("whyPoints", form.text.whyPoints.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
                      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => moveWhyPoint(index, -1)}><ArrowUp className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${label} down`} disabled={index === form.text.whyPoints.length - 1} onClick={() => moveWhyPoint(index, 1)}><ArrowDown className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={() => updateText("whyPoints", form.text.whyPoints.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>
                    </div>
                    <Textarea aria-label={`${label} text`} rows={2} value={point.text} maxLength={ROUTE_TEXT_LIMITS.whyText} placeholder="A sentence or two" onChange={(event) => updateText("whyPoints", form.text.whyPoints.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} />
                  </div>
                )
              })}
              <FieldError message={errors["text.whyPoints"]} />
              <Button type="button" variant="outline" disabled={form.text.whyPoints.length >= ROUTE_WHY_LIMIT} onClick={() => updateText("whyPoints", [...form.text.whyPoints, { title: "", text: "" }])}><Plus className="size-4" />Add point</Button>
              <p className="text-xs text-muted-foreground">Points with an empty title or text are not saved.</p>
            </div>
          </>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {autoFaqs.length > 0 && <div><p className="text-sm font-medium">Written by the site</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{autoFaqs.map((faq) => <li key={faq.question}>{faq.question}</li>)}</ul></div>}
          <p className="text-sm font-medium">Your extra questions</p>
          {form.text.faqs.map((faq, index) => (
            <div key={index} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <Input aria-label={`Question ${index + 1}`} value={faq.question} placeholder="Question" onChange={(event) => updateText("faqs", form.text.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} />
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${index + 1}`} onClick={() => updateText("faqs", form.text.faqs.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>
              </div>
              <Textarea aria-label={`Answer ${index + 1}`} rows={3} value={faq.answer} placeholder="Answer" onChange={(event) => updateText("faqs", form.text.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} />
            </div>
          ))}
          <FieldError message={errors["text.faqs"]} />
          <Button type="button" variant="outline" disabled={form.text.faqs.length >= ROUTE_FAQ_LIMIT} onClick={() => updateText("faqs", [...form.text.faqs, { question: "", answer: "" }])}><Plus className="size-4" />Add question</Button>
          <p className="text-xs text-muted-foreground">Questions with an empty question or answer are not saved.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Search engines</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {!facts ? <p className="text-sm text-muted-foreground">Choose both places first.</p> : <>
            <OptionalText id="route-seo-title" label="SEO title" value={form.text.seoTitle} max={ROUTE_TEXT_LIMITS.seoTitle} fallback={defaultRouteSeoTitle(facts)} error={errors["text.seoTitle"]} onChange={(value) => updateText("seoTitle", value)} />
            <OptionalText id="route-seo-description" label="SEO description" rows={3} value={form.text.seoDescription} max={ROUTE_TEXT_LIMITS.seoDescription} fallback={defaultRouteSeoDescription(facts)} error={errors["text.seoDescription"]} onChange={(value) => updateText("seoDescription", value)} />
            <p className="text-xs text-muted-foreground">The default description also names your lowest price.</p>
          </>}
        </CardContent>
      </Card>

      {route && <div className="flex justify-end"><Button variant="ghost" className="text-destructive" disabled={pending} onClick={remove}><Trash2 className="size-4" />Delete route page</Button></div>}
    </div>
  )
}
