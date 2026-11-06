"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { DestinationPicker } from "@/components/destination-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TRAVELLER_CARD_ICONS, createSectionItem, type DestinationSection, type DestinationSectionItem } from "@/lib/destination-content"

type Changes = Partial<Pick<DestinationSection, "fields" | "items">>

const textareaClass = "min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"

/** Card editors for the "Who we drive", "Places you can book from", "Ferry & cruise information", Airport Guide ("Plan your journey") and Airport map (pickup guide) Content Sections. */
export function SectionItemsEditor({ section, onChange }: { section: DestinationSection; onChange: (changes: Changes) => void }) {
  const items = section.items ?? []
  const isPorts = section.type === "ferry_cruise"
  // Ports are places too: each one needs a Google Places location for its booking buttons.
  const isPlaces = section.type === "place_links" || isPorts
  const isSteps = section.type === "map"
  const isGuide = section.type === "airport_guide"
  const isTravel = section.type === "travel_information"
  const groupNames = [...new Set(items.map((item) => item.group?.trim()).filter((name): name is string => Boolean(name)))]
  const noun = isSteps ? "step" : isPorts ? "port" : isPlaces ? "place" : "card"

  function setItems(next: DestinationSectionItem[]) { onChange({ items: next }) }
  function updateItem(index: number, changes: Partial<DestinationSectionItem>) { setItems(items.map((item, i) => i === index ? { ...item, ...changes } : item)) }
  function moveItem(index: number, offset: -1 | 1) {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + offset, 0, moved)
    setItems(next)
  }
  function setField(key: string, value: string) { onChange({ fields: { ...section.fields, [key]: value } }) }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {isPorts && (
        <div className="space-y-1.5"><Label htmlFor={`${section.id}-note`}>Important note under the cards (optional)</Label><textarea id={`${section.id}-note`} className={textareaClass} value={section.fields.note ?? ""} onChange={(event) => setField("note", event.target.value)} /></div>
      )}
      {isPlaces && !isPorts && (
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-list-heading`}>List heading</Label><Input id={`${section.id}-list-heading`} value={section.fields.listHeading ?? ""} placeholder="You can arrange a taxi to the airport from places like:" onChange={(event) => setField("listHeading", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-closing`}>Closing text (optional)</Label><textarea id={`${section.id}-closing`} className={textareaClass} value={section.fields.closing ?? ""} placeholder="You can also book a taxi from the airport to any of these places or further away." onChange={(event) => setField("closing", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-cta`}>Button text</Label><Input id={`${section.id}-cta`} value={section.fields.cta ?? ""} placeholder="Get a Quote for Your Journey" onChange={(event) => setField("cta", event.target.value)} /></div>
        </div>
      )}

      {isSteps && (
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">The Content above is the introduction beside the heading. Leave a field empty to use the airport-specific default.</p>
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-steps-heading`}>Steps heading</Label><Input id={`${section.id}-steps-heading`} value={section.fields.stepsHeading ?? ""} placeholder="How Your … Airport Pickup Works" onChange={(event) => setField("stepsHeading", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-drop-heading`}>Drop-off card heading</Label><Input id={`${section.id}-drop-heading`} value={section.fields.dropHeading ?? ""} placeholder="… Airport Drop-Off Service" onChange={(event) => setField("dropHeading", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-drop-text`}>Drop-off card text</Label><textarea id={`${section.id}-drop-text`} className={textareaClass} value={section.fields.dropText ?? ""} placeholder="Your driver takes you to the terminal drop-off area. Allow enough time for traffic, check-in and security." onChange={(event) => setField("dropText", event.target.value)} /></div>
        </div>
      )}

      {isTravel && (
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">Shown as &ldquo;Plan your journey&rdquo;. The Content above is the introduction under the heading. Leave the Section heading as &ldquo;Travel information&rdquo; to use &ldquo;… Airport Taxis and Transfers&rdquo;.</p>
          <div className="space-y-1.5"><Label htmlFor={`${section.id}-closing`}>Closing text under the cards (optional)</Label><textarea id={`${section.id}-closing`} className={textareaClass} value={section.fields.closing ?? ""} placeholder="Whether you are travelling for a holiday, business trip or international flight…" onChange={(event) => setField("closing", event.target.value)} /></div>
        </div>
      )}
      {isGuide && <p className="text-xs text-muted-foreground">Shown as &ldquo;Plan your journey&rdquo;. The Content above is the introduction under the heading. Leave the Section heading as &ldquo;Airport Guide&rdquo; to use &ldquo;… Airport Information and Travel Guide&rdquo;.</p>}

      <div>
        <Label>{isTravel ? "Travel cards" : isGuide ? "Guide cards" : isSteps ? "Pickup steps" : isPorts ? "Ports" : isPlaces ? "Places" : "Cards"}</Label>
        <p className="text-xs text-muted-foreground">{isTravel ? "Cards side by side, each with a list of bullet points. A card without bullet points doesn't show on the page; with no cards at all, the section keeps the older text layout." : isGuide ? "Cards next to each other with the same group heading show together in one row, under that heading. Two cards fit a row of two, four a row of four, anything else rows of three. With no cards, this section doesn't show on the page." : isSteps ? "Numbered cards beside the airport map. With no steps, the page keeps the older map layout." : isPlaces ? `Each ${noun} gets two booking buttons, to and from the airport. Choose it from Google Places so the booking form opens with the route filled in.` : "Shown as a row of cards. Four cards fit one row."}</p>
      </div>

      {items.map((item, index) => {
        const label = `${isSteps ? "Step" : isPorts ? "Port" : isPlaces ? "Place" : "Card"} ${index + 1}`
        const missingLocation = isPlaces && (item.latitude === undefined || item.longitude === undefined)
        return (
          <div key={item.id} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{label}{item.title ? `: ${item.title}` : ""}</p>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => moveItem(index, -1)}><ArrowUp /></Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${label} down`} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}><ArrowDown /></Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${label}`} onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 /></Button>
              </div>
            </div>
            {isTravel ? (
              <>
                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-icon`}>Icon</Label><select id={`${item.id}-icon`} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm" value={item.icon} onChange={(event) => updateItem(index, { icon: event.target.value })}><option value="">No icon</option>{Object.entries(TRAVELLER_CARD_ICONS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></div>
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-title`}>Title</Label><Input id={`${item.id}-title`} value={item.title} placeholder="e.g. Key Travel Information" onChange={(event) => updateItem(index, { title: event.target.value })} /></div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${item.id}-text`}>Bullet points</Label>
                  <textarea id={`${item.id}-text`} className={`${textareaClass} min-h-40`} value={item.text} placeholder={"Nearest railway station: Birmingham International, linked to the terminal by the free Air-Rail Link.\nRoad access: Via the M42 at Junction 6 and the A45."} onChange={(event) => updateItem(index, { text: event.target.value })} />
                  <p className="text-xs text-muted-foreground">One bullet point per line. Start a line with &ldquo;Label: &rdquo; to make the label bold.</p>
                </div>
              </>
            ) : isGuide ? (
              <>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-group`}>Group heading</Label><Input id={`${item.id}-group`} list={`${section.id}-groups`} value={item.group ?? ""} placeholder="e.g. Getting to Birmingham Airport" onChange={(event) => updateItem(index, { group: event.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-icon`}>Icon</Label><select id={`${item.id}-icon`} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm" value={item.icon} onChange={(event) => updateItem(index, { icon: event.target.value })}><option value="">No icon</option>{Object.entries(TRAVELLER_CARD_ICONS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></div>
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-title`}>Title</Label><Input id={`${item.id}-title`} value={item.title} placeholder="e.g. By rail" onChange={(event) => updateItem(index, { title: event.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-text`}>Text</Label><textarea id={`${item.id}-text`} className={textareaClass} value={item.text} onChange={(event) => updateItem(index, { text: event.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-button`}>Button text (optional)</Label><Input id={`${item.id}-button`} value={item.linkLabel} placeholder="Get my fixed price" onChange={(event) => updateItem(index, { linkLabel: event.target.value })} /><p className="text-xs text-muted-foreground">Adds a booking button to the airport and highlights the card.</p></div>
              </>
            ) : isSteps ? (
              <>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-title`}>Title</Label><Input id={`${item.id}-title`} value={item.title} placeholder="e.g. Meet your driver" onChange={(event) => updateItem(index, { title: event.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-text`}>Text</Label><textarea id={`${item.id}-text`} className={textareaClass} value={item.text} onChange={(event) => updateItem(index, { text: event.target.value })} /></div>
              </>
            ) : isPlaces ? (
              <>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-title`}>Name on the card</Label><Input id={`${item.id}-title`} value={item.title} placeholder={isPorts ? "e.g. Southampton Cruise Terminal" : "e.g. Reading"} onChange={(event) => updateItem(index, { title: event.target.value })} /></div>
                {isPorts && <div className="space-y-1.5"><Label htmlFor={`${item.id}-text`}>Text</Label><textarea id={`${item.id}-text`} className={textareaClass} value={item.text} placeholder="Distance, journey time and what to check before you travel." onChange={(event) => updateItem(index, { text: event.target.value })} /></div>}
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <DestinationPicker defaultValue={item.address} placeholder={isPorts ? "Search for the port or terminal in Google Places" : "Search for the town or city in Google Places"} onSelect={(place) => updateItem(index, { address: place.address, latitude: place.lat, longitude: place.lng, title: item.title || place.address.split(",")[0] })} onClear={() => updateItem(index, { address: "", latitude: undefined, longitude: undefined })} />
                  {missingLocation ? <p className="text-xs text-destructive">Choose a location, or this place won&apos;t show on the page.</p> : <p className="text-xs text-muted-foreground">{item.address}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-href`}>Page link (optional)</Label><Input id={`${item.id}-href`} value={item.linkHref} placeholder="/destinations/reading-taxi" onChange={(event) => updateItem(index, { linkHref: event.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-link-label`}>Link text</Label><Input id={`${item.id}-link-label`} value={item.linkLabel} placeholder="Reading taxi guide" onChange={(event) => updateItem(index, { linkLabel: event.target.value })} /></div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-icon`}>Icon</Label><select id={`${item.id}-icon`} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm" value={item.icon} onChange={(event) => updateItem(index, { icon: event.target.value })}><option value="">No icon</option>{Object.entries(TRAVELLER_CARD_ICONS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></div>
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-title`}>Title</Label><Input id={`${item.id}-title`} value={item.title} onChange={(event) => updateItem(index, { title: event.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor={`${item.id}-text`}>Text</Label><textarea id={`${item.id}-text`} className={textareaClass} value={item.text} onChange={(event) => updateItem(index, { text: event.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-link-label`}>Link text (optional)</Label><Input id={`${item.id}-link-label`} value={item.linkLabel} placeholder="See executive cars" onChange={(event) => updateItem(index, { linkLabel: event.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor={`${item.id}-href`}>Link</Label><Input id={`${item.id}-href`} value={item.linkHref} placeholder="#vehicles or /book" onChange={(event) => updateItem(index, { linkHref: event.target.value })} /></div>
                </div>
              </>
            )}
          </div>
        )
      })}

      {isGuide && <datalist id={`${section.id}-groups`}>{groupNames.map((name) => <option key={name} value={name} />)}</datalist>}
      {/* A new guide card joins the last card's group, which is usually where the next card goes. */}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, createSectionItem(isGuide && items.length ? { group: items[items.length - 1].group ?? "" } : {})])}><Plus className="size-4" /> Add {noun}</Button>
      {!isSteps && !isGuide && !isTravel && <p className="text-xs text-muted-foreground">Links can be a page on this site (starting with /), a section of this page (#vehicles), or an https:// address.</p>}
    </div>
  )
}
