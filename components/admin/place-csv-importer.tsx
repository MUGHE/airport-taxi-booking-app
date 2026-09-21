"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { confirmPlaceImportAction, previewPlaceImportAction } from "@/lib/actions"
import { placeImportTemplate, type PlaceImportPreviewRow } from "@/lib/place-csv-import"

type Preview = { errors: string[]; rows: PlaceImportPreviewRow[] }
type Report = Awaited<ReturnType<typeof confirmPlaceImportAction>>

export function PlaceCsvImporter() {
  const [csv, setCsv] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function downloadTemplate() {
    const link = document.createElement("a")
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(placeImportTemplate())}`
    link.download = "place-import-template.csv"
    link.click()
  }

  function inspectFile(file: File | undefined) {
    if (!file) return
    setError(""); setReport(null); setPreview(null); setCsv("")
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : ""
      setCsv(text)
      startTransition(async () => {
        const result = await previewPlaceImportAction(text)
        if (!result.ok) { setError(result.error); return }
        setPreview(result.preview)
        setSelected(result.preview.rows.filter((row) => row.blockers.length === 0).map((row) => row.rowNumber))
      })
    }
    reader.onerror = () => setError("The CSV file could not be read.")
    reader.readAsText(file)
  }

  function confirm() {
    startTransition(async () => {
      const result = await confirmPlaceImportAction(csv, selected)
      setReport(result)
      if (!result.ok) setError(result.error)
      else setError("")
    })
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-semibold tracking-tight">Import Place Drafts</h2><p className="mt-1 text-sm text-muted-foreground">Upload approved Place data for a safe, reviewable Draft import. Nothing is published.</p></div>
      <Button type="button" variant="outline" onClick={downloadTemplate}>Download CSV template</Button>
    </div>
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold">1. Upload a CSV</h3>
      <p className="mt-1 text-sm text-muted-foreground">Use semicolons for multiple aliases, localities, or airport slugs. Previewing does not write data or call Google Places.</p>
      <input className="mt-4 block w-full rounded-lg border border-input bg-background p-2 text-sm" type="file" accept=".csv,text/csv" aria-label="Place CSV file" onChange={(event) => inspectFile(event.target.files?.[0])} disabled={isPending} />
      {isPending && <p className="mt-3 text-sm text-muted-foreground" role="status">Checking the CSV…</p>}
    </section>
    {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
    {preview && <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">2. Review rows</h3><p className="mt-1 text-sm text-muted-foreground">Only selected rows with no blockers can be imported. Row numbers match the uploaded file.</p></div><Button type="button" disabled={isPending || selected.length === 0} onClick={confirm}>Create {selected.length} Draft{selected.length === 1 ? "" : "s"}</Button></div>
      {preview.errors.length > 0 && <ul className="mt-4 space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{preview.errors.map((item) => <li key={item}>{item}</li>)}</ul>}
      <div className="mt-5 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Use</th><th className="px-3 py-2">Row</th><th className="px-3 py-2">Place</th><th className="px-3 py-2">Type / Group</th><th className="px-3 py-2">Generated Slug</th><th className="px-3 py-2">Parent</th><th className="px-3 py-2">Airports</th><th className="px-3 py-2">Checks</th></tr></thead><tbody className="divide-y divide-border">{preview.rows.map((row) => { const checked = selected.includes(row.rowNumber); return <tr key={row.rowNumber} className="align-top"><td className="px-3 py-3"><input type="checkbox" aria-label={`Select CSV row ${row.rowNumber}`} checked={checked} disabled={row.blockers.length > 0 || isPending} onChange={() => setSelected((current) => checked ? current.filter((number) => number !== row.rowNumber) : [...current, row.rowNumber])} /></td><td className="px-3 py-3 font-mono">{row.rowNumber}</td><td className="px-3 py-3"><p className="font-medium">{row.name || "(empty)"}</p>{row.existingMatch && <p className="mt-1 text-xs text-destructive">Existing match: {row.existingMatch}</p>}<p className="mt-1 text-xs text-muted-foreground">Aliases: {row.aliases.join(", ") || "—"}</p><p className="text-xs text-muted-foreground">Localities: {row.coveredLocalities.join(", ") || "—"}</p></td><td className="px-3 py-3">{row.placeType || "—"}<br /><span className="text-xs text-muted-foreground">{row.placeGroup || "—"}</span></td><td className="px-3 py-3 font-mono text-xs">{row.slug || "—"}</td><td className="px-3 py-3">{row.parentPlace || "—"}</td><td className="px-3 py-3 font-mono text-xs">{row.supportedAirportSlugs.join(", ") || "—"}</td><td className="max-w-xs px-3 py-3"><div className="flex flex-wrap gap-1">{row.blockers.map((item) => <Badge key={item} variant="destructive">{item}</Badge>)}{row.warnings.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}{row.blockers.length === 0 && row.warnings.length === 0 && <Badge>Ready</Badge>}</div></td></tr> })}</tbody></table></div>
    </section>}
    {report?.ok && <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">3. Import report</h3><div className="mt-3 grid gap-3 sm:grid-cols-3"><p><strong>{report.result.created.length}</strong> created</p><p><strong>{report.result.skipped.length}</strong> skipped</p><p><strong>{report.result.failed.length}</strong> failed</p></div>{report.result.created.length > 0 && <ul className="mt-4 space-y-1 text-sm">{report.result.created.map((item) => <li key={item.id}>Row {item.rowNumber}: <Link className="text-primary underline" href={item.href}>{item.name}</Link></li>)}</ul>}{[...report.result.skipped, ...report.result.failed].map((item) => <p key={`${item.rowNumber}-${item.reason}`} className="mt-2 text-sm text-muted-foreground">Row {item.rowNumber} — {item.name || "(empty)"}: {item.reason}</p>)}</section>}
  </div>
}
