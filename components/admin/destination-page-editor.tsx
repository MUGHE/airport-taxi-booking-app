"use client"

import Link from "next/link"
import { useEffect, useState, useTransition, type ReactNode } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { publishAdminDestinationPageAction, restoreAdminDestinationPageAction, saveAdminDestinationPageAction, setAirportFeaturedAction } from "@/lib/actions"
import { CloudinaryImagePicker } from "@/components/admin/cloudinary-image-picker"
import { DESTINATION_SECTION_TYPES, SECTION_LABELS, createDestinationSection, normalizeDestinationContent, type DestinationContentDocument, type DestinationSectionType, type RichTextBlock } from "@/lib/destination-content"
import type { AdminDestinationPage, AdminRelatedDestination, AdminTerminal, SaveAdminDestinationPageInput } from "@/lib/admin-destination-pages"
import type { ReusableDestinationContent } from "@/lib/admin-destination-pages"
import type { PublishWarning } from "@/lib/publish-readiness"
import { destinationPageEditorSchema, type DestinationPageEditorValues } from "@/lib/destination-page-form-schema"
import { DraftPreviewPanel } from "@/components/admin/draft-preview-panel"
import { SITE_URL } from "@/lib/site"

const emptyTerminal = (): AdminTerminal => ({ displayName: "Main Terminal", address: "", latitude: 0, longitude: 0, sortOrder: 0, isPrimary: true })

function EditorSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-secondary/30"
        onClick={() => setOpen((current) => !current)}
      >
        <span><span className="block font-semibold">{title}</span><span className="mt-0.5 block text-sm text-muted-foreground">{description}</span></span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground">
          {open ? "Collapse" : "Open"}
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div hidden={!open} className="space-y-4 border-t border-border p-5">{children}</div>
    </section>
  )
}

function initialForm(initialPage?: AdminDestinationPage): SaveAdminDestinationPageInput {
  if (initialPage) return {
    id: initialPage.id, slug: initialPage.slug, officialName: initialPage.officialName, displayName: initialPage.displayName,
    iataCode: initialPage.iataCode, serviceArea: initialPage.serviceArea, googlePlaceId: initialPage.googlePlaceId,
    address: initialPage.address, latitude: initialPage.latitude, longitude: initialPage.longitude, terminals: initialPage.terminals, relatedDestinations: initialPage.relatedDestinations,
    seoTitle: initialPage.draft.seoTitle, metaDescription: initialPage.draft.metaDescription, h1: initialPage.draft.h1, content: initialPage.draft.content,
  }
  return { slug: "", officialName: "", displayName: "", iataCode: "", serviceArea: "", googlePlaceId: "", address: "", latitude: 0, longitude: 0, terminals: [emptyTerminal()], relatedDestinations: [], content: normalizeDestinationContent(undefined, "Airport Taxi & Transfers") }
}

function bodyText(section: { body: { text: string }[] }): string { return section.body.map((block) => block.text).join("\n") }

function editorValues(form: SaveAdminDestinationPageInput): DestinationPageEditorValues {
  return {
    officialName: form.officialName,
    displayName: form.displayName,
    iataCode: form.iataCode,
    serviceArea: form.serviceArea,
    slug: form.slug,
    googlePlaceId: form.googlePlaceId,
    address: form.address,
    latitude: form.latitude,
    longitude: form.longitude,
  }
}

export function DestinationPageEditor({ initialPage, relatedCandidates, reusableContent }: { initialPage?: AdminDestinationPage; relatedCandidates: { id: string; displayName: string; slug: string }[]; reusableContent: ReusableDestinationContent }) {
  const [form, setForm] = useState<SaveAdminDestinationPageInput>(() => initialForm(initialPage))
  const [dirty, setDirty] = useState(false)
  const [featured, setFeatured] = useState(initialPage?.featured ?? false)
  const [pendingWarnings, setPendingWarnings] = useState<PublishWarning[]>([])
  const [pendingWarningSetHash, setPendingWarningSetHash] = useState("")
  const [isPending, startTransition] = useTransition()
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<DestinationPageEditorValues>({
    defaultValues: editorValues(initialForm(initialPage)),
    resolver: zodResolver(destinationPageEditorSchema),
    mode: "onBlur",
  })
  const content = form.content ?? normalizeDestinationContent(undefined, form.h1 || `${form.displayName || "Airport"} Airport Taxi & Transfers`)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  function update<K extends keyof SaveAdminDestinationPageInput>(key: K, value: SaveAdminDestinationPageInput[K]) {
    setForm((current) => ({ ...current, [key]: value })); setDirty(true)
  }
  function updateContent(next: DestinationContentDocument) { update("content", next) }
  function toggleReusable(kind: "serviceFacts" | "globalFaqs" | "reviews", item: unknown) {
    const items = content[kind] as unknown[]
    const itemId = (item as { id: string }).id
    updateContent({ ...content, [kind]: items.some((current) => (current as { id: string }).id === itemId) ? items.filter((current) => (current as { id: string }).id !== itemId) : [...items, item] })
  }
  function updateAirportFaq(index: number, field: "question" | "answer", value: string) {
    const airportFaqs = content.airportFaqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, [field]: value } : faq)
    updateContent({ ...content, airportFaqs })
  }
  const completedAirportFaqCount = content.airportFaqs.filter((faq) => faq.question.trim() && faq.answer.trim()).length
  function selectPlace(place: PlaceSelection) { setValue("googlePlaceId", place.placeId, { shouldValidate: true }); setValue("address", place.address, { shouldValidate: true }); setValue("latitude", place.lat, { shouldValidate: true }); setValue("longitude", place.lng, { shouldValidate: true }); update("googlePlaceId", place.placeId); update("address", place.address); update("latitude", place.lat); update("longitude", place.lng) }
  function updateTerminal(index: number, key: keyof AdminTerminal, value: string | boolean) { update("terminals", form.terminals.map((terminal, i) => i === index ? { ...terminal, [key]: key === "latitude" || key === "longitude" ? Number(value) : value } : terminal)) }
  function moveTerminal(index: number, direction: -1 | 1) { const next = index + direction; if (next < 0 || next >= form.terminals.length) return; const terminals = [...form.terminals]; [terminals[index], terminals[next]] = [terminals[next], terminals[index]]; update("terminals", terminals) }
  function updateSection(index: number, changes: Record<string, unknown>) { updateContent({ ...content, sections: content.sections.map((section, i) => i === index ? { ...section, ...changes } : section) }) }
  function moveSection(index: number, direction: -1 | 1) { const next = index + direction; if (next < 0 || next >= content.sections.length) return; const sections = [...content.sections]; [sections[index], sections[next]] = [sections[next], sections[index]]; updateContent({ ...content, sections }) }
  function addRelatedDestination(pageId: string) {
    const candidate = relatedCandidates.find((item) => item.id === pageId)
    if (!candidate || form.relatedDestinations.some((item) => item.pageId === pageId)) return
    update("relatedDestinations", [...form.relatedDestinations, { pageId, displayName: candidate.displayName, slug: candidate.slug, heading: `Travel between ${form.displayName || "this airport"} and ${candidate.displayName}`, description: `Book a fixed-price airport transfer between ${form.displayName || "this airport"} and ${candidate.displayName}.`, reverseHeading: `Travel between ${candidate.displayName} and ${form.displayName || "this airport"}`, reverseDescription: `Book a fixed-price airport transfer between ${candidate.displayName} and ${form.displayName || "this airport"}.` }])
  }
  function updateRelated(index: number, changes: Partial<AdminRelatedDestination>) { update("relatedDestinations", form.relatedDestinations.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item)) }

  function submit(values: DestinationPageEditorValues) {
    startTransition(async () => {
      const result = await saveAdminDestinationPageAction({ ...form, ...values, content })
      if (!result.ok) { toast.error(result.error); return }
      setForm((current) => ({ ...current, id: result.page.id, ...editorValues(result.page), content: result.page.draft.content })); reset(editorValues(result.page)); setDirty(false); toast.success("Draft saved.")
    })
  }

  function publish() {
    if (!form.id) { toast.error("Save the Draft before publishing."); return }
    startTransition(async () => {
      const result = await publishAdminDestinationPageAction(form.id!)
      if (!result.ok) {
        if (result.warnings?.length && result.warningSetHash) {
          setPendingWarnings(result.warnings)
          setPendingWarningSetHash(result.warningSetHash)
          return
        }
        toast.error(result.error); return
      }
      setDirty(false); toast.success("Published successfully.")
    })
  }

  function cancelWarningOverride() {
    setPendingWarnings([])
    setPendingWarningSetHash("")
  }

  function confirmWarningOverride() {
    if (!form.id || !pendingWarnings.length) return
    startTransition(async () => {
      const result = await publishAdminDestinationPageAction(form.id!, { warningSetHash: pendingWarningSetHash, warnings: pendingWarnings })
      if (!result.ok) {
        if (result.warnings?.length && result.warningSetHash) {
          setPendingWarnings(result.warnings)
          setPendingWarningSetHash(result.warningSetHash)
        } else toast.error(result.error)
        return
      }
      cancelWarningOverride()
      setDirty(false); toast.success("Published successfully.")
    })
  }

  function restore() {
    if (!form.id || dirty) return
    startTransition(async () => {
      const result = await restoreAdminDestinationPageAction(form.id!)
      if (!result.ok) { toast.error(result.error); return }
      setForm((current) => ({ ...current, ...result.page, ...editorValues(result.page), content: result.page.draft.content }))
      reset(editorValues(result.page))
      setDirty(false)
      toast.success("Previous Published Snapshot restored as a Draft.")
    })
  }

  function toggleFeatured(nextFeatured: boolean) {
    if (!form.id || dirty || initialPage?.lifecycleState !== "published") return
    startTransition(async () => {
      const result = await setAirportFeaturedAction(form.id!, nextFeatured)
      if (!result.ok) { toast.error(result.error); return }
      setFeatured(nextFeatured)
      toast.success(nextFeatured ? "Airport added to Featured navigation." : "Airport removed from Featured navigation.")
    })
  }

  useEffect(() => {
    if (!pendingWarnings.length) return
    toast.warning(<div className="space-y-3">
      <div><p className="font-semibold">Review quality warnings</p><p>These warnings do not block publication, but publishing will record your deliberate override.</p></div>
      <ul className="space-y-2">{pendingWarnings.map((warning) => <li key={warning.code}><p className="font-medium">{warning.message}</p><p>{warning.reason}</p></li>)}</ul>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={cancelWarningOverride}>Cancel</Button><Button type="button" size="sm" disabled={isPending} onClick={confirmWarningOverride}>{isPending && <Loader2 className="size-4 animate-spin" />} Proceed and publish</Button></div>
    </div>, { toastId: "publish-quality-warning", autoClose: false, closeOnClick: false })
    return () => { toast.dismiss("publish-quality-warning") }
  }, [pendingWarnings, isPending])

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/destination-pages" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Destination Pages</Link>
      <div className="mb-6"><h2 className="text-xl font-semibold tracking-tight">{initialPage ? "Edit Airport Page" : "Create Airport Page"}</h2><p className="mt-1 text-sm text-muted-foreground">Build the identity and structured content for this Airport Page draft.</p></div>
      {initialPage?.hasUnpublishedChanges && <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">This page has saved changes that are not public yet. Review them and publish when ready.</p>}
      <DraftPreviewPanel pageId={form.id} dirty={dirty} />
      {initialPage?.lifecycleState === "published" && <section className="mb-6 rounded-xl border border-border bg-card p-5"><label className="flex items-start gap-3"><input type="checkbox" checked={featured} disabled={isPending || dirty} onChange={(event) => toggleFeatured(event.target.checked)} /><span><span className="block font-medium">Featured Airport</span><span className="block text-sm text-muted-foreground">Show this Published Airport Page in the homepage and header. No more than six can be selected.</span></span></label></section>}
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <EditorSection title="Related destinations" description="Only Published Airport Pages can be selected. One relationship supplies both page directions.">
          {!initialPage && <p className="rounded-lg bg-secondary px-3 py-2 text-sm">Save this page as a draft first, then add related destinations.</p>}
          {initialPage && <><select aria-label="Published related destination" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm" defaultValue="" onChange={(event) => { addRelatedDestination(event.target.value); event.target.value = "" }}><option value="">Add a Published Airport Page</option>{relatedCandidates.filter((candidate) => !form.relatedDestinations.some((item) => item.pageId === candidate.id)).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.displayName} · {candidate.slug}</option>)}</select>
            <div className="space-y-4">{form.relatedDestinations.map((related, index) => <div key={related.pageId} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{related.displayName}</p><p className="text-xs text-muted-foreground">{related.slug}</p></div><Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove related destination ${related.displayName}`} onClick={() => update("relatedDestinations", form.relatedDestinations.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Heading on this page</Label><Input value={related.heading} onChange={(event) => updateRelated(index, { heading: event.target.value })} /></div><div className="space-y-1.5"><Label>Description on this page</Label><textarea className="min-h-20 w-full rounded-lg border border-input px-2.5 py-2 text-sm" value={related.description} onChange={(event) => updateRelated(index, { description: event.target.value })} /></div><div className="space-y-1.5"><Label>Heading on related page</Label><Input value={related.reverseHeading} onChange={(event) => updateRelated(index, { reverseHeading: event.target.value })} /></div><div className="space-y-1.5"><Label>Description on related page</Label><textarea className="min-h-20 w-full rounded-lg border border-input px-2.5 py-2 text-sm" value={related.reverseDescription} onChange={(event) => updateRelated(index, { reverseDescription: event.target.value })} /></div></div></div>)}</div></>}
        </EditorSection>
        {initialPage && form.relatedDestinations.length > 0 && <EditorSection title="Related destination images" description="Images are optional. Choose only approved media from the library.">{form.relatedDestinations.map((related, index) => <div key={related.pageId} className="space-y-4 rounded-lg border border-border p-4"><div><p className="mb-3 font-medium">{related.displayName} — image on this page</p><CloudinaryImagePicker kind="content" value={related.image} onChange={(image) => updateRelated(index, { image })} /></div><div><p className="mb-3 font-medium">{related.displayName} — image on the related page</p><CloudinaryImagePicker kind="content" value={related.reverseImage} onChange={(image) => updateRelated(index, { reverseImage: image })} /></div></div>)}</EditorSection>}
        <EditorSection title="Page identity" description="Airport Page is the only usable page type in this release."><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Page type</Label><Input value="Airport Page" readOnly /></div><Controller control={control} name="officialName" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="official-name">Official name</Label><Input id="official-name" {...field} value={form.officialName} onChange={(e) => { field.onChange(e); update("officialName", e.target.value) }} />{errors.officialName?.message && <p role="alert" className="text-sm text-destructive">{errors.officialName.message}</p>}</div>} /><Controller control={control} name="displayName" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="display-name">Display name</Label><Input id="display-name" {...field} value={form.displayName} onChange={(e) => { field.onChange(e); update("displayName", e.target.value) }} />{errors.displayName?.message && <p role="alert" className="text-sm text-destructive">{errors.displayName.message}</p>}</div>} /><Controller control={control} name="iataCode" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="iata">IATA code</Label><Input id="iata" maxLength={3} {...field} value={form.iataCode} onChange={(e) => { const value = e.target.value.toUpperCase(); field.onChange(value); update("iataCode", value) }} placeholder="LHR" />{errors.iataCode?.message && <p role="alert" className="text-sm text-destructive">{errors.iataCode.message}</p>}</div>} /><Controller control={control} name="serviceArea" render={({ field }) => <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="service-area">Service area</Label><Input id="service-area" {...field} value={form.serviceArea} onChange={(e) => { field.onChange(e); update("serviceArea", e.target.value) }} />{errors.serviceArea?.message && <p role="alert" className="text-sm text-destructive">{errors.serviceArea.message}</p>}</div>} /><Controller control={control} name="slug" render={({ field }) => <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="slug">Airport Slug</Label><Input id="slug" {...field} value={form.slug} onChange={(e) => { const value = e.target.value.toLowerCase(); field.onChange(value); update("slug", value) }} placeholder="heathrow-airport-taxi" />{errors.slug?.message ? <p role="alert" className="text-sm text-destructive">{errors.slug.message}</p> : <p className="text-xs text-muted-foreground">Lowercase, hyphen-separated, and ending in -airport-taxi.</p>}</div>} /></div></EditorSection>

        <EditorSection title="SEO" description="Set the search title, summary, page heading, and canonical path before publication.">
          <div className="space-y-1.5"><Label htmlFor="seo-title">SEO title</Label><Input id="seo-title" value={form.seoTitle ?? ""} onChange={(event) => update("seoTitle", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="meta-description">Meta description</Label><textarea id="meta-description" className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" value={form.metaDescription ?? ""} onChange={(event) => update("metaDescription", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="page-h1">H1 page heading</Label><Input id="page-h1" value={form.h1 ?? ""} onChange={(event) => update("h1", event.target.value)} /></div>
          <div className="rounded-xl border border-border bg-background p-4" aria-labelledby="search-result-preview-heading">
            <h4 id="search-result-preview-heading" className="text-sm font-medium text-muted-foreground">Search-result preview</h4>
            <p className="mt-3 truncate text-sm text-emerald-700">{SITE_URL}/airport-transfers/{form.slug || "your-airport-taxi"}</p>
            <p className="mt-1 text-xl text-blue-700">{form.seoTitle || "Your SEO title"}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{form.metaDescription || "Your meta description will appear here."}</p>
          </div>
        </EditorSection>

        <EditorSection title="Google airport location" description="Select the airport to store its stable Google identity and exact coordinates."><DestinationPicker defaultValue={form.address} onSelect={selectPlace} placeholder="Search for the airport in Google Places" />{errors.googlePlaceId?.message && <p role="alert" className="text-sm text-destructive">{errors.googlePlaceId.message}</p>}{errors.address?.message && <p role="alert" className="text-sm text-destructive">{errors.address.message}</p>}{form.googlePlaceId && <div className="rounded-lg bg-secondary/60 p-3 text-sm"><p className="font-medium">Selected location</p><p>{form.address}</p><p className="mt-1 text-xs text-muted-foreground">Google Place ID: {form.googlePlaceId} · Latitude {form.latitude} · Longitude {form.longitude}</p></div>}</EditorSection>

        <EditorSection title="Structured page content" description="The branded hero stays first and the final booking CTA stays last. Middle sections use approved types only.">
          <div className="rounded-lg border border-dashed border-border p-4"><p className="font-medium">Hero and quote form</p><Input className="mt-3" aria-label="Hero heading" value={content.hero.heading} onChange={(e) => updateContent({ ...content, hero: { ...content.hero, heading: e.target.value } })} /><p className="mt-2 text-xs text-muted-foreground">Safe formatting supports headings, paragraphs, bold, lists, and HTTPS or known internal links. Custom HTML, scripts, colours, and fonts are not stored.</p><div className="mt-4"><CloudinaryImagePicker kind="hero" value={content.hero.image} onChange={(image) => updateContent({ ...content, hero: { ...content.hero, image } })} /></div></div>
          <div className="space-y-3" aria-label="Content sections">{content.sections.map((section, index) => <div key={section.id} className={`rounded-lg border p-4 ${section.visible ? "border-border" : "border-dashed border-muted-foreground/50 bg-muted/30"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{section.title}</p><p className="text-xs text-muted-foreground">{section.required ? "Required section" : "Optional section"}{!section.visible && " · hidden"}</p></div><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${section.title} up`} disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${section.title} down`} disabled={index === content.sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown /></Button><Button type="button" variant="outline" size="sm" disabled={section.required} title={section.required ? "Required sections cannot be hidden" : undefined} onClick={() => updateSection(index, { visible: !section.visible })}>{section.visible ? "Hide" : "Show"}</Button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${section.title}`} disabled={section.required} title={section.required ? "Required sections cannot be removed" : undefined} onClick={() => updateContent({ ...content, sections: content.sections.filter((_, i) => i !== index) })}><Trash2 /></Button></div></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]"><div className="space-y-1.5"><Label htmlFor={`section-type-${section.id}`}>Section type</Label><select id={`section-type-${section.id}`} className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" value={section.type} onChange={(e) => { const type = e.target.value as DestinationSectionType; updateSection(index, { type, title: SECTION_LABELS[type], required: ["introduction", "benefits", "fleet_pricing", "airport_guide", "faq", "map"].includes(type) }) }}><option value={section.type}>{SECTION_LABELS[section.type]}</option>{DESTINATION_SECTION_TYPES.filter((type) => type !== section.type).map((type) => <option key={type} value={type}>{SECTION_LABELS[type]}</option>)}</select></div><div className="space-y-1.5"><Label htmlFor={`section-format-${section.id}`}>Text format</Label><select id={`section-format-${section.id}`} className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" value={section.body[0]?.type ?? "paragraph"} onChange={(e) => { const type = e.target.value as RichTextBlock["type"]; updateSection(index, { body: bodyText(section) ? [{ type, text: bodyText(section), ...(type === "link" ? { href: section.body[0]?.href || "/book", label: bodyText(section) } : {}) }] : [] }) }}><option value="heading">Heading</option><option value="paragraph">Paragraph</option><option value="bold">Bold</option><option value="list">List</option><option value="link">Link</option></select></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor={`section-body-${section.id}`}>Content</Label><textarea id={`section-body-${section.id}`} className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" value={bodyText(section)} onChange={(e) => updateSection(index, { body: e.target.value ? [{ type: section.body[0]?.type ?? "paragraph", text: e.target.value, ...(section.body[0]?.href ? { href: section.body[0].href, label: e.target.value } : {}) }] : [] })} placeholder="Write useful, airport-specific content here." /></div>{section.body[0]?.type === "link" && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor={`section-link-${section.id}`}>Link target</Label><Input id={`section-link-${section.id}`} value={section.body[0].href ?? ""} placeholder="/book or https://example.com" onChange={(e) => updateSection(index, { body: [{ ...section.body[0], href: e.target.value, label: bodyText(section) }] })} /><p className="text-xs text-muted-foreground">Internal links use a stable site path. External links must use HTTPS.</p></div>}</div>
            {section.type === "airport_guide" && <div className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(section.fields).map(([key, value]) => <div key={key} className="space-y-1.5"><Label htmlFor={`guide-${section.id}-${key}`}>{key === "sourceNotes" ? "Editorial source/verification notes (private)" : key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</Label><textarea id={`guide-${section.id}-${key}`} className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm" value={value} onChange={(e) => updateSection(index, { fields: { ...section.fields, [key]: e.target.value } })} /></div>)}</div>}
            <div className="mt-3"><CloudinaryImagePicker kind="content" value={section.image} onChange={(image) => updateSection(index, { image })} /></div>
          </div>)}</div>
          <div className="flex flex-wrap items-center gap-2"><select aria-label="New section type" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" defaultValue=""><option value="">Choose a section</option>{DESTINATION_SECTION_TYPES.filter((type) => !content.sections.some((section) => section.type === type)).map((type) => <option key={type} value={type}>{SECTION_LABELS[type]}</option>)}</select><Button type="button" variant="outline" onClick={(event) => { const select = event.currentTarget.previousElementSibling as HTMLSelectElement; if (!select.value) return; updateContent({ ...content, sections: [...content.sections, createDestinationSection(select.value as DestinationSectionType)] }); select.value = "" }}><Plus className="size-4" /> Add section</Button><span className="text-xs text-muted-foreground">Word count is guidance, not a hard limit.</span></div>
          <div className="rounded-lg border border-dashed border-border p-4"><p className="font-medium">Final booking CTA</p><Input className="mt-3" aria-label="Final CTA heading" value={content.finalCta.heading} onChange={(e) => updateContent({ ...content, finalCta: { ...content.finalCta, heading: e.target.value } })} /></div>
        </EditorSection>

        <EditorSection title="Reusable facts, FAQs and reviews" description="Shared content is approved centrally. Selecting it copies the approved wording into this Draft; it cannot be rewritten here.">
          <div>
            <h4 className="font-medium">Service Facts</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {reusableContent.serviceFacts.map((fact) => <label key={fact.id} className="flex gap-3 rounded-lg border border-border p-3"><input type="checkbox" checked={content.serviceFacts.some((selected) => selected.id === fact.id)} onChange={() => toggleReusable("serviceFacts", fact)} /><span><span className="block font-medium">{fact.title}</span><span className="block text-sm text-muted-foreground">{fact.description}</span></span></label>)}
            </div>
          </div>
          <div>
            <h4 className="font-medium">Global FAQs</h4>
            <div className="mt-3 space-y-2">{reusableContent.globalFaqs.map((faq) => <label key={faq.id} className="flex gap-3 rounded-lg border border-border p-3"><input type="checkbox" checked={content.globalFaqs.some((selected) => selected.id === faq.id)} onChange={() => toggleReusable("globalFaqs", faq)} /><span><span className="block font-medium">{faq.question}</span><span className="block text-sm text-muted-foreground">{faq.answer}</span></span></label>)}</div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3"><h4 className="font-medium">Airport-specific FAQs</h4><span className={completedAirportFaqCount < 3 ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{completedAirportFaqCount}/3 minimum</span></div>
            <p className="mt-1 text-sm text-muted-foreground">Add at least three local questions. These are separate from shared FAQs. Publishing will require this minimum.</p>
            <div className="mt-3 space-y-3">{content.airportFaqs.map((faq, index) => <div key={faq.id} className="rounded-lg border border-border p-3"><div className="grid gap-3"><Input aria-label={`Airport FAQ ${index + 1} question`} value={faq.question} onChange={(event) => updateAirportFaq(index, "question", event.target.value)} placeholder="Airport-specific question" /><textarea aria-label={`Airport FAQ ${index + 1} answer`} className="min-h-20 w-full rounded-lg border border-input px-2.5 py-2 text-sm" value={faq.answer} onChange={(event) => updateAirportFaq(index, "answer", event.target.value)} placeholder="Airport-specific answer" /></div></div>)}</div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => updateContent({ ...content, airportFaqs: [...content.airportFaqs, { id: `airport-faq-${Date.now()}`, question: "", answer: "" }] })}><Plus className="size-4" /> Add airport FAQ</Button>
          </div>
          <div>
            <h4 className="font-medium">Verified reviews</h4><p className="mt-1 text-sm text-muted-foreground">Reviews use central attribution only. No airport-specific customer claim or rating is created.</p>
            <div className="mt-3 space-y-2">{reusableContent.reviews.map((review) => <label key={review.id} className="flex gap-3 rounded-lg border border-border p-3"><input type="checkbox" checked={content.reviews.some((selected) => selected.id === review.id)} onChange={() => toggleReusable("reviews", review)} /><span><span className="block">“{review.quote}”</span><span className="block text-sm text-muted-foreground">{review.author} · {review.source}</span></span></label>)}</div>
          </div>
        </EditorSection>

        <EditorSection title="Airport Terminals" description="Add each pickup location. Select exactly one primary entry for booking links."><div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => update("terminals", [...form.terminals, { ...emptyTerminal(), isPrimary: false, sortOrder: form.terminals.length }])}><Plus className="size-4" /> Add terminal</Button></div><div className="space-y-3">{form.terminals.map((terminal, index) => <div key={terminal.id ?? index} className="rounded-lg border border-border p-4"><div className="mb-3 flex items-center justify-between gap-2"><p className="font-medium">Terminal {index + 1}</p><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-xs" aria-label="Move terminal up" disabled={index === 0} onClick={() => moveTerminal(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label="Move terminal down" disabled={index === form.terminals.length - 1} onClick={() => moveTerminal(index, 1)}><ArrowDown /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label="Remove terminal" disabled={form.terminals.length === 1} onClick={() => update("terminals", form.terminals.filter((_, i) => i !== index))}><Trash2 /></Button></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Name</Label><Input value={terminal.displayName} onChange={(e) => updateTerminal(index, "displayName", e.target.value)} /></div><div className="space-y-1.5"><Label>Address</Label><Input value={terminal.address} onChange={(e) => updateTerminal(index, "address", e.target.value)} /></div><div className="space-y-1.5"><Label>Latitude</Label><Input type="number" step="any" value={terminal.latitude} onChange={(e) => updateTerminal(index, "latitude", e.target.value)} /></div><div className="space-y-1.5"><Label>Longitude</Label><Input type="number" step="any" value={terminal.longitude} onChange={(e) => updateTerminal(index, "longitude", e.target.value)} /></div></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="radio" name="primary-terminal" checked={terminal.isPrimary} onChange={() => update("terminals", form.terminals.map((item, i) => ({ ...item, isPrimary: i === index })))} /> Primary Airport Terminal</label></div>)}</div></EditorSection>

        <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur"><span className="text-sm text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</span><div className="flex gap-2">{initialPage?.lifecycleState === "published" && <Button type="button" variant="outline" disabled={isPending || dirty} onClick={restore}>Restore previous</Button>}{form.id && <Button type="button" variant="default" disabled={isPending || dirty} onClick={publish}>Publish</Button>}<Button type="submit" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />} Save Draft</Button></div></div>
      </form>
    </div>
  )
}
