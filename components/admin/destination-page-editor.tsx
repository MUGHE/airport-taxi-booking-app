"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, Check, CircleAlert, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { archiveAdminDestinationPageAction, deleteAdminDestinationDraftAction, publishAdminDestinationPageAction, restoreAdminDestinationPageAction, saveAdminDestinationPageAction, setAdminBookingAvailabilityAction, setAirportFeaturedAction } from "@/lib/actions"
import { CloudinaryImagePicker } from "@/components/admin/cloudinary-image-picker"
import { DESTINATION_SECTION_TYPES, SECTION_LABELS, createDestinationSection, isRequiredDestinationSectionType, normalizeDestinationContent, tiptapDocumentToBlocks, type DestinationContentDocument, type DestinationSectionType } from "@/lib/destination-content"
import type { AdminDestinationPage, AdminRelatedDestination, AdminTerminal, SaveAdminDestinationPageInput } from "@/lib/admin-destination-pages"
import type { ReusableDestinationContent } from "@/lib/admin-destination-pages"
import { getPublishBlockers, type PublishBlocker, type PublishWarning } from "@/lib/publish-readiness"
import { destinationPageEditorSchema, type DestinationPageEditorValues } from "@/lib/destination-page-form-schema"
import { FullPreviewButton } from "@/components/admin/full-preview-button"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { SITE_URL } from "@/lib/site"

const emptyTerminal = (): AdminTerminal => ({ displayName: "Main Terminal", address: "", latitude: 0, longitude: 0, sortOrder: 0, isPrimary: true })

const EDITOR_TABS = [
  { value: "basic-info", label: "Basic info" },
  { value: "seo", label: "SEO" },
  { value: "location", label: "Location" },
  { value: "hero", label: "Hero" },
  { value: "content", label: "Content" },
  { value: "faq-trust", label: "FAQ & trust" },
  { value: "related", label: "Related" },
  { value: "publish", label: "Publish" },
] as const

type EditorTab = (typeof EDITOR_TABS)[number]["value"]
type DraftSaveState = "idle" | "saving" | "saved" | "error"

function blockerTab(code: string): EditorTab {
  if (["invalid-slug", "duplicate-value", "missing-seo-title", "missing-meta-description", "missing-h1"].includes(code)) return "seo"
  if (["incomplete-location", "invalid-terminal", "missing-primary-terminal"].includes(code)) return "location"
  if (code === "missing-service-area") return "basic-info"
  if (code === "missing-hero") return "hero"
  if (code === "minimum-faqs") return "faq-trust"
  if (["minimum-related-pages", "invalid-relationships"].includes(code)) return "related"
  if (code.startsWith("missing-") || ["invalid-media", "unsafe-link", "missing-link-label", "broken-internal-link"].includes(code)) return "content"
  return "basic-info"
}

function validationTab(field: string): EditorTab {
  if (["slug"].includes(field)) return "seo"
  if (["googlePlaceId", "address", "latitude", "longitude"].includes(field)) return "location"
  return "basic-info"
}

function EditorPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
    <div className="mb-5"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
    <div className="space-y-5">{children}</div>
  </section>
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
  const [activeTab, setActiveTab] = useState<EditorTab>("basic-info")
  const [selectedContentId, setSelectedContentId] = useState(() => initialForm(initialPage).content?.sections[0]?.id ?? "final-cta")
  const [newSectionType, setNewSectionType] = useState<DestinationSectionType | "">("")
  const [dirty, setDirty] = useState(false)
  const [featured, setFeatured] = useState(initialPage?.featured ?? false)
  const [bookingAvailable, setBookingAvailable] = useState(initialPage?.bookingAvailable ?? true)
  const [replacementSlug, setReplacementSlug] = useState("airport-transfers")
  const [pendingWarnings, setPendingWarnings] = useState<PublishWarning[]>([])
  const [pendingWarningSetHash, setPendingWarningSetHash] = useState("")
  const [serverBlockers, setServerBlockers] = useState<PublishBlocker[]>([])
  const [saveState, setSaveState] = useState<DraftSaveState>(initialPage ? "saved" : "idle")
  const editVersion = useRef(0)
  const [isPending, startTransition] = useTransition()
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<DestinationPageEditorValues>({
    defaultValues: editorValues(initialForm(initialPage)),
    resolver: zodResolver(destinationPageEditorSchema),
    mode: "onBlur",
  })
  const content = form.content ?? normalizeDestinationContent(undefined, form.h1 || `${form.displayName || "Airport"} Airport Taxi & Transfers`)
  const selectedContentSection = content.sections.find((section) => section.id === selectedContentId) ?? content.sections[0]
  const publishBlockers = getPublishBlockers({
    ...form,
    seoTitle: form.seoTitle ?? "",
    metaDescription: form.metaDescription ?? "",
    h1: form.h1 ?? "",
    content,
  })
  const allPublishBlockers = [...publishBlockers, ...serverBlockers.filter((serverBlocker) => !publishBlockers.some((blocker) => blocker.code === serverBlocker.code))]
  const blockerCounts = allPublishBlockers.reduce<Partial<Record<EditorTab, number>>>((counts, blocker) => {
    const tab = blockerTab(blocker.code)
    counts[tab] = (counts[tab] ?? 0) + 1
    return counts
  }, {})

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  function update<K extends keyof SaveAdminDestinationPageInput>(key: K, value: SaveAdminDestinationPageInput[K]) {
    editVersion.current += 1
    setForm((current) => ({ ...current, [key]: value })); setDirty(true); setSaveState("idle"); setServerBlockers([]); cancelWarningOverride()
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
  function selectTerminalPlace(index: number, place: PlaceSelection) { update("terminals", form.terminals.map((terminal, i) => i === index ? { ...terminal, address: place.address, latitude: place.lat, longitude: place.lng } : terminal)) }
  function clearTerminalPlace(index: number) { update("terminals", form.terminals.map((terminal, i) => i === index ? { ...terminal, address: "", latitude: NaN, longitude: NaN } : terminal)) }
  function moveTerminal(index: number, direction: -1 | 1) { const next = index + direction; if (next < 0 || next >= form.terminals.length) return; const terminals = [...form.terminals]; [terminals[index], terminals[next]] = [terminals[next], terminals[index]]; update("terminals", terminals) }
  function updateSection(index: number, changes: Record<string, unknown>) { updateContent({ ...content, sections: content.sections.map((section, i) => i === index ? { ...section, ...changes } : section) }) }
  function moveSection(index: number, direction: -1 | 1) { const next = index + direction; if (next < 0 || next >= content.sections.length) return; const sections = [...content.sections]; [sections[index], sections[next]] = [sections[next], sections[index]]; updateContent({ ...content, sections }) }
  function addSection(type: DestinationSectionType) {
    const section = createDestinationSection(type)
    updateContent({ ...content, sections: [...content.sections, section] })
    setSelectedContentId(section.id)
  }
  function removeSection(index: number) {
    const remaining = content.sections.filter((_, sectionIndex) => sectionIndex !== index)
    updateContent({ ...content, sections: remaining })
    if (content.sections[index]?.id === selectedContentId) setSelectedContentId(remaining[Math.min(index, remaining.length - 1)]?.id ?? "final-cta")
  }
  function addRelatedDestination(pageId: string) {
    const candidate = relatedCandidates.find((item) => item.id === pageId)
    if (!candidate || form.relatedDestinations.some((item) => item.pageId === pageId)) return
    update("relatedDestinations", [...form.relatedDestinations, { pageId, displayName: candidate.displayName, slug: candidate.slug, heading: `Travel between ${form.displayName || "this airport"} and ${candidate.displayName}`, description: `Book a fixed-price airport transfer between ${form.displayName || "this airport"} and ${candidate.displayName}.`, reverseHeading: `Travel between ${candidate.displayName} and ${form.displayName || "this airport"}`, reverseDescription: `Book a fixed-price airport transfer between ${candidate.displayName} and ${form.displayName || "this airport"}.` }])
  }
  function updateRelated(index: number, changes: Partial<AdminRelatedDestination>) { update("relatedDestinations", form.relatedDestinations.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item)) }

  function saveDraft(input: SaveAdminDestinationPageInput) {
    const requestedVersion = editVersion.current
    setSaveState("saving")
    startTransition(async () => {
      const result = await saveAdminDestinationPageAction(input)
      if (!result.ok) { setSaveState("error"); toast.error(result.error); return }
      setForm((current) => current.id ? current : { ...current, id: result.page.id })
      if (requestedVersion === editVersion.current) {
        reset(editorValues(result.page))
        setDirty(false)
        setSaveState("saved")
      } else setSaveState("idle")
      toast.success("Draft saved.")
    })
  }

  function submit(values: DestinationPageEditorValues) {
    saveDraft({ ...form, ...values, content })
  }

  function publish() {
    if (!form.id) { toast.error("Save the Draft before publishing."); return }
    if (allPublishBlockers.length) { setActiveTab("publish"); toast.error("Complete the items that need attention before publishing."); return }
    startTransition(async () => {
      const result = await publishAdminDestinationPageAction(form.id!)
      if (!result.ok) {
        if (result.blockers?.length) {
          setServerBlockers(result.blockers)
          setActiveTab("publish")
          toast.error(result.error)
          return
        }
        if (result.warnings?.length && result.warningSetHash) {
          setPendingWarnings(result.warnings)
          setPendingWarningSetHash(result.warningSetHash)
          setActiveTab("publish")
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
        if (result.blockers?.length) {
          setServerBlockers(result.blockers)
          setActiveTab("publish")
          toast.error(result.error)
          return
        }
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

  function toggleBookingAvailability(nextAvailable: boolean) {
    if (!form.id || dirty || initialPage?.lifecycleState !== "published") return
    startTransition(async () => {
      const result = await setAdminBookingAvailabilityAction(form.id!, nextAvailable)
      if (!result.ok) { toast.error(result.error); return }
      setBookingAvailable(nextAvailable)
      toast.success(nextAvailable ? "Online booking restored." : "Online booking marked unavailable.")
    })
  }

  function deleteDraft() {
    if (!form.id || initialPage?.lifecycleState !== "draft" || !window.confirm("Permanently delete this never-published Draft? This cannot be undone.")) return
    startTransition(async () => {
      const result = await deleteAdminDestinationDraftAction(form.id!)
      if (!result.ok) { toast.error(result.error); return }
      window.location.href = "/admin/destination-pages"
    })
  }

  function archive() {
    if (!form.id || initialPage?.lifecycleState !== "published" || !window.confirm("Archive this Published Page? Its current URL will permanently redirect to the selected replacement.")) return
    startTransition(async () => {
      const result = await archiveAdminDestinationPageAction(form.id!, replacementSlug)
      if (!result.ok) { toast.error(result.error); return }
      window.location.href = "/admin/destination-pages"
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/destination-pages" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Destination Pages</Link>
      <form onSubmit={handleSubmit(submit, (invalid) => {
        const field = Object.keys(invalid)[0]
        setActiveTab(validationTab(field))
        const message = field ? ({ slug: "Add an Airport Slug in SEO.", googlePlaceId: "Select the airport from Google Places in Location.", address: "Select the airport address from Google Places.", latitude: "Select a valid airport location from Google Places.", longitude: "Select a valid airport location from Google Places." } as Record<string, string>)[field] : undefined
        toast.error(message ?? "Complete the highlighted fields before saving this Draft.")
      })}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EditorTab)}>
          <div className="sticky top-2 z-20 rounded-xl border border-border bg-background/95 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-xl font-semibold tracking-tight">{form.displayName || (initialPage ? "Edit Airport Page" : "Create Airport Page")}</h2><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">{initialPage?.lifecycleState ?? "draft"}</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{saveState === "saving" ? "Saving Draft…" : saveState === "error" ? "Draft save failed · Retry" : dirty ? "Unsaved changes" : saveState === "saved" ? "Draft saved" : "Changes not saved"}{dirty && form.id ? " · Full Preview shows the last saved Draft" : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FullPreviewButton pageId={form.id} dirty={dirty} />
                <Button type="submit" variant="outline" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />} Save draft</Button>
                <Button type="button" disabled={!form.id || isPending || dirty} onClick={publish}>Publish</Button>
              </div>
            </div>
            <div className="overflow-x-auto border-t border-border px-2 sm:px-4">
              <TabsList variant="line" aria-label="Airport Page editor sections" className="h-auto min-w-max justify-start py-1">
                {EDITOR_TABS.map((tab) => {
                  const count = tab.value === "publish" ? allPublishBlockers.length : blockerCounts[tab.value] ?? 0
                  return <TabsTrigger key={tab.value} value={tab.value} className="h-11 min-w-fit px-3">
                    {tab.label}
                    {count > 0 ? <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive/10 px-1 text-xs text-destructive"><CircleAlert aria-hidden="true" className="size-3" /><span className="sr-only">{count} {count === 1 ? "item needs" : "items need"} attention</span><span aria-hidden="true">{count}</span></span> : tab.value !== "publish" && <span className="text-emerald-600"><Check aria-hidden="true" className="size-3.5" /><span className="sr-only">Complete</span></span>}
                  </TabsTrigger>
                })}
              </TabsList>
            </div>
          </div>

          {initialPage?.hasUnpublishedChanges && <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">This page has saved changes that are not public yet. Review them and publish when ready.</p>}

          <div className="mt-6">
            <TabsContent value="basic-info">
              <EditorPanel title="Basic information" description="Start with the customer-facing page title and the airport's core identity.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller control={control} name="displayName" render={({ field }) => <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="display-name">Page title</Label><Input id="display-name" {...field} value={form.displayName} onChange={(event) => { field.onChange(event); update("displayName", event.target.value) }} placeholder="Heathrow Airport" />{errors.displayName?.message ? <p role="alert" className="text-sm text-destructive">{errors.displayName.message}</p> : <p className="text-xs text-muted-foreground">The short, customer-facing airport name.</p>}</div>} />
                  <div className="space-y-1.5"><Label>Page type</Label><Input value="Airport Page" readOnly /></div>
                  <Controller control={control} name="officialName" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="official-name">Official name</Label><Input id="official-name" {...field} value={form.officialName} onChange={(event) => { field.onChange(event); update("officialName", event.target.value) }} />{errors.officialName?.message && <p role="alert" className="text-sm text-destructive">{errors.officialName.message}</p>}</div>} />
                  <Controller control={control} name="iataCode" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="iata">IATA code</Label><Input id="iata" maxLength={3} {...field} value={form.iataCode} onChange={(event) => { const value = event.target.value.toUpperCase(); field.onChange(value); update("iataCode", value) }} placeholder="LHR" />{errors.iataCode?.message && <p role="alert" className="text-sm text-destructive">{errors.iataCode.message}</p>}</div>} />
                  <Controller control={control} name="serviceArea" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="service-area">Service area</Label><Input id="service-area" {...field} value={form.serviceArea} onChange={(event) => { field.onChange(event); update("serviceArea", event.target.value) }} placeholder="London and surrounding areas" />{errors.serviceArea?.message && <p role="alert" className="text-sm text-destructive">{errors.serviceArea.message}</p>}</div>} />
                </div>
              </EditorPanel>
            </TabsContent>

            <TabsContent value="seo">
              <EditorPanel title="Search and page headings" description="Set the public URL and the text shown in search results.">
                <Controller control={control} name="slug" render={({ field }) => <div className="space-y-1.5"><Label htmlFor="slug">Airport Slug</Label><Input id="slug" {...field} value={form.slug} onChange={(event) => { const value = event.target.value.toLowerCase(); field.onChange(value); update("slug", value) }} placeholder="heathrow-airport-taxi" />{errors.slug?.message ? <p role="alert" className="text-sm text-destructive">{errors.slug.message}</p> : <p className="text-xs text-muted-foreground">Lowercase words separated by hyphens and ending in -airport-taxi.</p>}</div>} />
                <div className="space-y-1.5"><Label htmlFor="seo-title">SEO title</Label><Input id="seo-title" value={form.seoTitle ?? ""} onChange={(event) => update("seoTitle", event.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="meta-description">Meta description</Label><textarea id="meta-description" className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" value={form.metaDescription ?? ""} onChange={(event) => update("metaDescription", event.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="page-h1">H1 page heading</Label><Input id="page-h1" value={form.h1 ?? ""} onChange={(event) => update("h1", event.target.value)} /></div>
                <div className="rounded-xl border border-border bg-background p-4" aria-labelledby="search-result-preview-heading"><h4 id="search-result-preview-heading" className="text-sm font-medium text-muted-foreground">Search-result preview</h4><p className="mt-3 truncate text-sm text-emerald-700">{SITE_URL}/airport-transfers/{form.slug || "your-airport-taxi"}</p><p className="mt-1 text-xl text-blue-700">{form.seoTitle || "Your SEO title"}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{form.metaDescription || "Your meta description will appear here."}</p></div>
              </EditorPanel>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <EditorPanel title="Airport location" description="Select the main airport result from Google Places.">
                <DestinationPicker defaultValue={form.address} onSelect={selectPlace} placeholder="Search for the airport in Google Places" />
                {errors.googlePlaceId?.message && <p role="alert" className="text-sm text-destructive">{errors.googlePlaceId.message}</p>}
                {errors.address?.message && <p role="alert" className="text-sm text-destructive">{errors.address.message}</p>}
                {form.googlePlaceId && <div className="rounded-lg bg-secondary/60 p-3 text-sm"><p className="font-medium">Selected location</p><p>{form.address}</p><p className="mt-1 text-xs text-muted-foreground">Google Place ID: {form.googlePlaceId} · Latitude {form.latitude} · Longitude {form.longitude}</p></div>}
              </EditorPanel>
              <EditorPanel title="Airport Terminals" description="Add pickup locations and select exactly one primary terminal.">
                <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => update("terminals", [...form.terminals, { ...emptyTerminal(), isPrimary: false, sortOrder: form.terminals.length }])}><Plus className="size-4" /> Add terminal</Button></div>
                <div className="space-y-3">{form.terminals.map((terminal, index) => <div key={terminal.id ?? index} className="rounded-lg border border-border p-4"><div className="mb-3 flex items-center justify-between gap-2"><p className="font-medium">Terminal {index + 1}</p><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-xs" aria-label={`Move terminal ${index + 1} up`} disabled={index === 0} onClick={() => moveTerminal(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Move terminal ${index + 1} down`} disabled={index === form.terminals.length - 1} onClick={() => moveTerminal(index, 1)}><ArrowDown /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove terminal ${index + 1}`} disabled={form.terminals.length === 1} onClick={() => update("terminals", form.terminals.filter((_, terminalIndex) => terminalIndex !== index))}><Trash2 /></Button></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor={`terminal-name-${index}`}>Name</Label><Input id={`terminal-name-${index}`} value={terminal.displayName} onChange={(event) => updateTerminal(index, "displayName", event.target.value)} /></div><div className="space-y-1.5"><Label>Address</Label><DestinationPicker defaultValue={terminal.address} placeholder="Search terminal address" onSelect={(place) => selectTerminalPlace(index, place)} onClear={() => clearTerminalPlace(index)} /></div></div><p className="mt-2 text-xs text-muted-foreground">Coordinates are filled automatically after selecting the Google Places result.</p><label className="mt-3 flex items-center gap-2 text-sm"><input type="radio" name="primary-terminal" checked={terminal.isPrimary} onChange={() => update("terminals", form.terminals.map((item, terminalIndex) => ({ ...item, isPrimary: terminalIndex === index })))} /> Primary Airport Terminal</label></div>)}</div>
              </EditorPanel>
            </TabsContent>

            <TabsContent value="hero">
              <EditorPanel title="Hero and quote form" description="This fixed section is always shown first on the public page.">
                <div className="space-y-1.5"><Label htmlFor="hero-heading">Hero heading</Label><Input id="hero-heading" value={content.hero.heading} onChange={(event) => updateContent({ ...content, hero: { ...content.hero, heading: event.target.value } })} /></div>
                <div className="space-y-1.5"><Label>Hero introduction</Label><RichTextEditor value={content.hero.bodyDocument ?? content.hero.body} onChange={(bodyDocument) => updateContent({ ...content, hero: { ...content.hero, body: tiptapDocumentToBlocks(bodyDocument), bodyDocument } })} /><p className="text-xs text-muted-foreground">Use useful, airport-specific wording. Custom HTML, colours and fonts are not stored.</p></div>
                <CloudinaryImagePicker kind="hero" value={content.hero.image} onChange={(image) => updateContent({ ...content, hero: { ...content.hero, image } })} />
              </EditorPanel>
            </TabsContent>

            <TabsContent value="content">
              <EditorPanel title="Page structure" description="Choose one Content Section to edit. Hero stays first and the final booking CTA stays last.">
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.6fr)]">
                  <div className="space-y-2" aria-label="Page structure">
                    <button type="button" className="w-full rounded-lg border border-dashed border-border p-3 text-left hover:bg-secondary/40" onClick={() => setActiveTab("hero")}><span className="block font-medium">Hero and quote form</span><span className="text-xs text-muted-foreground">Fixed first · Edit in Hero</span></button>
                    {content.sections.map((section, index) => {
                      const hasContent = section.body.some((block) => block.text.trim()) || Object.values(section.fields).some((value) => value.trim())
                      const selected = selectedContentSection?.id === section.id && selectedContentId !== "final-cta"
                      return <div key={section.id} className={`rounded-lg border p-2 ${selected ? "border-primary bg-primary/5" : section.visible ? "border-border" : "border-dashed border-muted-foreground/50 bg-muted/30"}`}>
                        <button type="button" className="w-full rounded-md p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-current={selected ? "true" : undefined} onClick={() => setSelectedContentId(section.id)}><span className="block font-medium">{section.title}</span><span className={`text-xs ${section.required && !hasContent ? "text-destructive" : "text-muted-foreground"}`}>{section.required ? "Required" : "Optional"}{!section.visible ? " · Hidden" : hasContent ? " · Has content" : " · Needs content"}</span></button>
                        <div className="mt-2 flex items-center gap-1 border-t border-border pt-2"><Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${section.title} up`} disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${section.title} down`} disabled={index === content.sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown /></Button><Button type="button" variant="ghost" size="sm" disabled={section.required} aria-describedby={section.required ? `required-help-${section.id}` : undefined} onClick={() => updateSection(index, { visible: !section.visible })}>{section.visible ? "Hide" : "Show"}</Button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${section.title}`} disabled={section.required} aria-describedby={section.required ? `required-help-${section.id}` : undefined} onClick={() => removeSection(index)}><Trash2 /></Button></div>{section.required && <p id={`required-help-${section.id}`} className="px-1 pt-1 text-xs text-muted-foreground">Required Content Sections stay visible and cannot be removed.</p>}
                      </div>
                    })}
                    <button type="button" className={`w-full rounded-lg border border-dashed p-3 text-left hover:bg-secondary/40 ${selectedContentId === "final-cta" ? "border-primary bg-primary/5" : "border-border"}`} aria-current={selectedContentId === "final-cta" ? "true" : undefined} onClick={() => setSelectedContentId("final-cta")}><span className="block font-medium">Final booking CTA</span><span className="text-xs text-muted-foreground">Fixed last</span></button>
                    <div className="space-y-2 border-t border-border pt-3"><select aria-label="New section type" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm" value={newSectionType} onChange={(event) => setNewSectionType(event.target.value as DestinationSectionType | "")}><option value="">Choose a section</option>{DESTINATION_SECTION_TYPES.filter((type) => !content.sections.some((section) => section.type === type)).map((type) => <option key={type} value={type}>{SECTION_LABELS[type]}</option>)}</select><Button type="button" variant="outline" className="w-full" disabled={!newSectionType} onClick={() => { if (!newSectionType) return; addSection(newSectionType); setNewSectionType("") }}><Plus className="size-4" /> Add Content Section</Button></div>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    {selectedContentId === "final-cta" ? <div className="space-y-4"><div><h4 className="font-semibold">Final booking CTA</h4><p className="text-sm text-muted-foreground">The closing booking prompt shown after page content.</p></div><div className="space-y-1.5"><Label htmlFor="final-cta-heading">Heading</Label><Input id="final-cta-heading" value={content.finalCta.heading} onChange={(event) => updateContent({ ...content, finalCta: { ...content.finalCta, heading: event.target.value } })} /></div><div className="space-y-1.5"><Label>Description</Label><RichTextEditor value={content.finalCta.bodyDocument ?? content.finalCta.body} onChange={(bodyDocument) => updateContent({ ...content, finalCta: { ...content.finalCta, body: tiptapDocumentToBlocks(bodyDocument), bodyDocument } })} /></div></div> : selectedContentSection ? <div className="space-y-4">
                      <div><h4 className="font-semibold">{selectedContentSection.title}</h4><p className="text-sm text-muted-foreground">{selectedContentSection.required ? "Required Content Section" : "Optional Content Section"}{!selectedContentSection.visible && " · Hidden from the public page"}</p></div>
                      <div className="space-y-1.5"><Label htmlFor={`section-type-${selectedContentSection.id}`}>Section type</Label><select id={`section-type-${selectedContentSection.id}`} className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm disabled:cursor-not-allowed disabled:bg-muted" value={selectedContentSection.type} disabled={selectedContentSection.required} title={selectedContentSection.required ? "Required Content Sections keep their assigned type" : undefined} onChange={(event) => { const type = event.target.value as DestinationSectionType; const index = content.sections.findIndex((section) => section.id === selectedContentSection.id); updateSection(index, { type, title: SECTION_LABELS[type], required: isRequiredDestinationSectionType(type) }) }}><option value={selectedContentSection.type}>{SECTION_LABELS[selectedContentSection.type]}</option>{DESTINATION_SECTION_TYPES.filter((type) => type !== selectedContentSection.type && !content.sections.some((section) => section.type === type)).map((type) => <option key={type} value={type}>{SECTION_LABELS[type]}</option>)}</select>{selectedContentSection.required && <p className="text-xs text-muted-foreground">Required Content Sections cannot change type.</p>}</div>
                      <div className="space-y-1.5"><Label>Content</Label><RichTextEditor value={selectedContentSection.bodyDocument ?? selectedContentSection.body} onChange={(bodyDocument) => { const index = content.sections.findIndex((section) => section.id === selectedContentSection.id); updateSection(index, { bodyDocument, body: tiptapDocumentToBlocks(bodyDocument) }) }} /><p className="text-xs text-muted-foreground">Headings, paragraphs, bold text, lists and safe links are supported.</p></div>
                      {selectedContentSection.type === "airport_guide" && <div className="grid gap-3 sm:grid-cols-2">{Object.entries(selectedContentSection.fields).map(([key, value]) => <div key={key} className="space-y-1.5"><Label htmlFor={`guide-${selectedContentSection.id}-${key}`}>{key === "sourceNotes" ? "Editorial source/verification notes (private)" : key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</Label><textarea id={`guide-${selectedContentSection.id}-${key}`} className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm" value={value} onChange={(event) => { const index = content.sections.findIndex((section) => section.id === selectedContentSection.id); updateSection(index, { fields: { ...selectedContentSection.fields, [key]: event.target.value } }) }} /></div>)}</div>}
                      <CloudinaryImagePicker kind="content" value={selectedContentSection.image} onChange={(image) => { const index = content.sections.findIndex((section) => section.id === selectedContentSection.id); updateSection(index, { image }) }} />
                    </div> : <p className="text-sm text-muted-foreground">Add a Content Section to begin.</p>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Word count is guidance, not a hard limit.</p>
              </EditorPanel>
            </TabsContent>

            <TabsContent value="faq-trust">
              <EditorPanel title="FAQs and trust content" description="Choose approved shared content and add airport-specific answers.">
                <div><h4 className="font-medium">Airport-specific FAQs</h4><div className="mt-1 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Add at least three complete local questions.</p><span className={completedAirportFaqCount < 3 ? "text-sm text-destructive" : "text-sm text-emerald-700"}>{completedAirportFaqCount}/3 minimum</span></div><div className="mt-3 space-y-3">{content.airportFaqs.map((faq, index) => <div key={faq.id} className="rounded-lg border border-border p-3"><div className="grid gap-3"><Input aria-label={`Airport FAQ ${index + 1} question`} value={faq.question} onChange={(event) => updateAirportFaq(index, "question", event.target.value)} placeholder="Airport-specific question" /><textarea aria-label={`Airport FAQ ${index + 1} answer`} className="min-h-20 w-full rounded-lg border border-input px-2.5 py-2 text-sm" value={faq.answer} onChange={(event) => updateAirportFaq(index, "answer", event.target.value)} placeholder="Airport-specific answer" /></div></div>)}</div><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => updateContent({ ...content, airportFaqs: [...content.airportFaqs, { id: `airport-faq-${Date.now()}`, question: "", answer: "" }] })}><Plus className="size-4" /> Add airport FAQ</Button></div>
                <div className="border-t border-border pt-5"><h4 className="font-medium">Shared FAQs</h4><div className="mt-3 space-y-2">{reusableContent.globalFaqs.map((faq) => <label key={faq.id} className="flex gap-3 rounded-lg border border-border p-3"><input type="checkbox" checked={content.globalFaqs.some((selected) => selected.id === faq.id)} onChange={() => toggleReusable("globalFaqs", faq)} /><span><span className="block font-medium">{faq.question}</span><span className="block text-sm text-muted-foreground">{faq.answer}</span></span></label>)}</div></div>
                <div className="border-t border-border pt-5"><h4 className="font-medium">Service Facts</h4><div className="mt-3 grid gap-3 sm:grid-cols-2">{reusableContent.serviceFacts.map((fact) => <label key={fact.id} className="flex gap-3 rounded-lg border border-border p-3"><input type="checkbox" checked={content.serviceFacts.some((selected) => selected.id === fact.id)} onChange={() => toggleReusable("serviceFacts", fact)} /><span><span className="block font-medium">{fact.title}</span><span className="block text-sm text-muted-foreground">{fact.description}</span></span></label>)}</div></div>
                <div className="border-t border-border pt-5"><h4 className="font-medium">Verified reviews</h4><p className="mt-1 text-sm text-muted-foreground">Reviews use central attribution and cannot be rewritten here.</p><div className="mt-3 space-y-2">{reusableContent.reviews.map((review) => <label key={review.id} className="flex gap-3 rounded-lg border border-border p-3"><input type="checkbox" checked={content.reviews.some((selected) => selected.id === review.id)} onChange={() => toggleReusable("reviews", review)} /><span><span className="block">“{review.quote}”</span><span className="block text-sm text-muted-foreground">{review.author} · {review.source}</span></span></label>)}</div></div>
              </EditorPanel>
            </TabsContent>

            <TabsContent value="related">
              <EditorPanel title="Related Routes" description="Connect this Airport Page to another Published Airport Page. Each direction keeps its own wording and image.">
                {!form.id && <p className="rounded-lg bg-secondary px-3 py-2 text-sm">Save this page as a Draft first, then add Related Routes.</p>}
                {form.id && <select aria-label="Published Related Route" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm" defaultValue="" onChange={(event) => { addRelatedDestination(event.target.value); event.target.value = "" }}><option value="">Add a Published Airport Page</option>{relatedCandidates.filter((candidate) => !form.relatedDestinations.some((item) => item.pageId === candidate.id)).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.displayName} · {candidate.slug}</option>)}</select>}
                <div className="space-y-4">{form.relatedDestinations.map((related, index) => <div key={related.pageId} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{related.displayName}</p><p className="text-xs text-muted-foreground">{related.slug}</p></div><Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove Related Route ${related.displayName}`} onClick={() => update("relatedDestinations", form.relatedDestinations.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Heading on this page</Label><Input value={related.heading} onChange={(event) => updateRelated(index, { heading: event.target.value })} /></div><div className="space-y-1.5"><Label>Description on this page</Label><textarea className="min-h-20 w-full rounded-lg border border-input px-2.5 py-2 text-sm" value={related.description} onChange={(event) => updateRelated(index, { description: event.target.value })} /></div><div className="space-y-1.5"><Label>Heading on Related Route page</Label><Input value={related.reverseHeading} onChange={(event) => updateRelated(index, { reverseHeading: event.target.value })} /></div><div className="space-y-1.5"><Label>Description on Related Route page</Label><textarea className="min-h-20 w-full rounded-lg border border-input px-2.5 py-2 text-sm" value={related.reverseDescription} onChange={(event) => updateRelated(index, { reverseDescription: event.target.value })} /></div></div><div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-2"><div><p className="mb-3 font-medium">Image on this page</p><CloudinaryImagePicker kind="content" value={related.image} onChange={(image) => updateRelated(index, { image })} /></div><div><p className="mb-3 font-medium">Image on the Related Route page</p><CloudinaryImagePicker kind="content" value={related.reverseImage} onChange={(image) => updateRelated(index, { reverseImage: image })} /></div></div></div>)}</div>
              </EditorPanel>
            </TabsContent>

            <TabsContent value="publish" className="space-y-6">
              <EditorPanel title="Publish readiness" description="Fix every blocking item before making this Draft public.">
                <div>
                  <h4 className="font-medium">Blocking errors</h4>
                  {allPublishBlockers.length === 0 ? <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-medium">Required fields complete</p><p className="mt-1">Save any changes and use Full Preview. Publish will then run final duplicate and quality checks against other pages.</p></div> : <div className="mt-3"><p className="mb-3 text-sm text-muted-foreground">{allPublishBlockers.length} {allPublishBlockers.length === 1 ? "item needs" : "items need"} attention.</p><ul className="space-y-2">{allPublishBlockers.map((blocker) => { const tab = blockerTab(blocker.code); const label = EDITOR_TABS.find((item) => item.value === tab)?.label ?? "Basic info"; return <li key={blocker.code}><button type="button" className="flex w-full items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left hover:bg-destructive/10" onClick={() => setActiveTab(tab)}><span><span className="block font-medium text-destructive">{blocker.message}</span><span className="mt-1 block text-xs text-muted-foreground">Open {label}</span></span><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" /></button></li> })}</ul></div>}
                </div>
                <div className="border-t border-border pt-5">
                  <h4 className="font-medium">Warnings</h4>
                  {pendingWarnings.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Quality warnings appear here after the final server check.</p> : <><ul className="mt-3 space-y-2">{pendingWarnings.map((warning) => <li key={warning.code} className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-medium">{warning.message}</p><p className="mt-1">{warning.reason}</p></li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Publishing will record that these warnings were deliberately accepted.</p><div className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={cancelWarningOverride}>Cancel</Button><Button type="button" size="sm" disabled={isPending} onClick={confirmWarningOverride}>{isPending && <Loader2 className="size-4 animate-spin" />} Accept warnings and publish</Button></div></>}
                </div>
              </EditorPanel>

              {initialPage && <EditorPanel title="Page controls" description="These settings affect an existing Draft or Published Page.">
                {initialPage.lifecycleState === "published" && <><label className="flex items-start gap-3"><input type="checkbox" checked={featured} disabled={isPending || dirty} onChange={(event) => toggleFeatured(event.target.checked)} /><span><span className="block font-medium">Featured Airport</span><span className="block text-sm text-muted-foreground">Show this Airport Page on the homepage and in the header. No more than six can be selected.</span></span></label><label className="flex items-start gap-3 border-t border-border pt-4"><input type="checkbox" checked={bookingAvailable} disabled={isPending || dirty} onChange={(event) => toggleBookingAvailability(event.target.checked)} /><span><span className="block font-medium">Online booking available</span><span className="block text-sm text-muted-foreground">When off, visitors can read the page but see Contact Us instead of quote buttons.</span></span></label><div className="flex flex-wrap gap-2 border-t border-border pt-4"><Button type="button" variant="outline" disabled={isPending || dirty} onClick={restore}>Restore previous</Button></div><div className="flex flex-wrap items-end gap-2 border-t border-border pt-4"><label className="min-w-60 flex-1 text-sm"><span className="mb-1 block font-medium">Archive replacement</span><select aria-label="Archive replacement" className="h-9 w-full rounded-lg border border-input bg-background px-2" value={replacementSlug} onChange={(event) => setReplacementSlug(event.target.value)}><option value="airport-transfers">Airport Transfers index</option>{relatedCandidates.map((candidate) => <option key={candidate.id} value={candidate.slug}>{candidate.displayName}</option>)}</select></label><Button type="button" variant="destructive" disabled={isPending || dirty} onClick={archive}>Archive Page</Button></div></>}
                {initialPage.lifecycleState === "draft" && <div className="flex justify-end"><Button type="button" variant="destructive" disabled={isPending || dirty} onClick={deleteDraft}>Delete Draft</Button></div>}
              </EditorPanel>}
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </div>
  )
}
