"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react"
import { DestinationPicker, type PlaceSelection } from "@/components/destination-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveAdminDestinationPageAction } from "@/lib/actions"
import type { AdminDestinationPage, AdminTerminal, SaveAdminDestinationPageInput } from "@/lib/admin-destination-pages"

const emptyTerminal = (): AdminTerminal => ({ displayName: "Main Terminal", address: "", latitude: 0, longitude: 0, sortOrder: 0, isPrimary: true })

export function DestinationPageEditor({ initialPage }: { initialPage?: AdminDestinationPage }) {
  const [form, setForm] = useState<SaveAdminDestinationPageInput>(() => initialPage ? {
    id: initialPage.id, slug: initialPage.slug, officialName: initialPage.officialName, displayName: initialPage.displayName, iataCode: initialPage.iataCode, serviceArea: initialPage.serviceArea, googlePlaceId: initialPage.googlePlaceId, address: initialPage.address, latitude: initialPage.latitude, longitude: initialPage.longitude, terminals: initialPage.terminals, seoTitle: initialPage.draft.seoTitle, metaDescription: initialPage.draft.metaDescription, h1: initialPage.draft.h1,
  } : { slug: "", officialName: "", displayName: "", iataCode: "", serviceArea: "", googlePlaceId: "", address: "", latitude: 0, longitude: 0, terminals: [emptyTerminal()] })
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof SaveAdminDestinationPageInput>(key: K, value: SaveAdminDestinationPageInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectPlace(place: PlaceSelection) {
    setForm((current) => ({ ...current, googlePlaceId: place.placeId, address: place.address, latitude: place.lat, longitude: place.lng }))
  }

  function updateTerminal(index: number, key: keyof AdminTerminal, value: string | boolean) {
    setForm((current) => ({ ...current, terminals: current.terminals.map((terminal, terminalIndex) => terminalIndex === index ? { ...terminal, [key]: key === "latitude" || key === "longitude" ? Number(value) : value } : terminal) }))
  }

  function moveTerminal(index: number, direction: -1 | 1) {
    setForm((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.terminals.length) return current
      const terminals = [...current.terminals]
      ;[terminals[index], terminals[nextIndex]] = [terminals[nextIndex], terminals[index]]
      return { ...current, terminals }
    })
  }

  function removeTerminal(index: number) {
    setForm((current) => ({ ...current, terminals: current.terminals.filter((_, terminalIndex) => terminalIndex !== index) }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSaved("")
    startTransition(async () => {
      const result = await saveAdminDestinationPageAction(form)
      if (!result.ok) { setError(result.error); return }
      setForm((current) => ({ ...current, id: result.page.id }))
      setSaved("Draft saved.")
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/destination-pages" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Destination Pages</Link>
      <div className="mb-6"><h2 className="text-xl font-semibold tracking-tight">{initialPage ? "Edit Airport Page" : "Create Airport Page"}</h2><p className="mt-1 text-sm text-muted-foreground">Build the identity and pickup locations for this Airport Page draft.</p></div>
      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 space-y-4"><div><h3 className="font-semibold">Page identity</h3><p className="text-sm text-muted-foreground">Airport Page is the only usable page type in this release.</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Page type</Label><Input value="Airport Page" readOnly /></div><div className="space-y-1.5"><Label htmlFor="official-name">Official name</Label><Input id="official-name" value={form.officialName} onChange={(e) => update("officialName", e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="iata">IATA code</Label><Input id="iata" maxLength={3} value={form.iataCode} onChange={(e) => update("iataCode", e.target.value.toUpperCase())} placeholder="LHR" /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="service-area">Service area</Label><Input id="service-area" value={form.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="slug">Airport Slug</Label><Input id="slug" value={form.slug} onChange={(e) => update("slug", e.target.value.toLowerCase())} placeholder="heathrow-airport-taxi" /><p className="text-xs text-muted-foreground">Lowercase, hyphen-separated, and ending in -airport-taxi.</p></div></div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4"><div><h3 className="font-semibold">Google airport location</h3><p className="text-sm text-muted-foreground">Select the airport to store its stable Google identity and exact coordinates.</p></div><DestinationPicker defaultValue={form.address} onSelect={selectPlace} placeholder="Search for the airport in Google Places" />{form.googlePlaceId && <div className="rounded-lg bg-secondary/60 p-3 text-sm"><p className="font-medium">Selected location</p><p>{form.address}</p><p className="mt-1 text-xs text-muted-foreground">Google Place ID: {form.googlePlaceId} · Latitude {form.latitude} · Longitude {form.longitude}</p></div>}</section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Airport Terminals</h3><p className="text-sm text-muted-foreground">Add each pickup location. Select exactly one primary entry for booking links.</p></div><Button type="button" variant="outline" size="sm" onClick={() => update("terminals", [...form.terminals, { ...emptyTerminal(), isPrimary: false, sortOrder: form.terminals.length }])}><Plus className="size-4" /> Add terminal</Button></div>
          <div className="space-y-3">{form.terminals.map((terminal, index) => <div key={terminal.id ?? index} className="rounded-lg border border-border p-4"><div className="mb-3 flex items-center justify-between gap-2"><p className="font-medium">Terminal {index + 1}</p><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-xs" aria-label="Move terminal up" disabled={index === 0} onClick={() => moveTerminal(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label="Move terminal down" disabled={index === form.terminals.length - 1} onClick={() => moveTerminal(index, 1)}><ArrowDown /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label="Remove terminal" onClick={() => removeTerminal(index)}><Trash2 /></Button></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Name</Label><Input value={terminal.displayName} onChange={(e) => updateTerminal(index, "displayName", e.target.value)} /></div><div className="space-y-1.5"><Label>Address</Label><Input value={terminal.address} onChange={(e) => updateTerminal(index, "address", e.target.value)} /></div><div className="space-y-1.5"><Label>Latitude</Label><Input type="number" step="any" value={terminal.latitude} onChange={(e) => updateTerminal(index, "latitude", e.target.value)} /></div><div className="space-y-1.5"><Label>Longitude</Label><Input type="number" step="any" value={terminal.longitude} onChange={(e) => updateTerminal(index, "longitude", e.target.value)} /></div></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="radio" name="primary-terminal" checked={terminal.isPrimary} onChange={() => update("terminals", form.terminals.map((item, terminalIndex) => ({ ...item, isPrimary: terminalIndex === index })))} /> Primary Airport Terminal</label></div>)}</div>
        </section>

        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}{saved && <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">{saved}</p>}
        <div className="flex items-center justify-end gap-3"><Button type="submit" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />} Save Draft</Button></div>
      </form>
    </div>
  )
}
