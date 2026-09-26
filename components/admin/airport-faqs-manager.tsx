"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteAdminAirportFaqAction, saveAdminAirportFaqAction } from "@/lib/actions"
import type { AdminAirportFaq } from "@/lib/airport-faqs"

const EMPTY_FORM = { question: "", answer: "" }

export function AirportFaqsManager({ initialFaqs }: { initialFaqs: AdminAirportFaq[] }) {
  const [faqs, setFaqs] = useState(initialFaqs)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    startTransition(async () => {
      const result = await saveAdminAirportFaqAction({ ...form, id: editingId ?? undefined })
      if (!result.ok) return setMessage(result.error)
      setFaqs((current) => editingId ? current.map((faq) => faq.id === result.faq.id ? result.faq : faq) : [result.faq, ...current])
      setForm(EMPTY_FORM)
      setEditingId(null)
      setMessage("FAQ saved.")
    })
  }

  function edit(faq: AdminAirportFaq) {
    setEditingId(faq.id)
    setForm({ question: faq.question, answer: faq.answer })
    setMessage("")
  }

  function remove(faq: AdminAirportFaq) {
    if (!window.confirm(`Delete “${faq.question}”?`)) return
    startTransition(async () => {
      const result = await deleteAdminAirportFaqAction(faq.id)
      if (!result.ok) return setMessage(result.error)
      setFaqs((current) => current.filter((item) => item.id !== faq.id))
      if (editingId === faq.id) { setEditingId(null); setForm(EMPTY_FORM) }
      setMessage("FAQ deleted.")
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <Card className="h-fit">
        <CardHeader><CardTitle>{editingId ? "Edit airport FAQ" : "Add airport FAQ"}</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="grid gap-1.5 text-sm font-medium">Question<Input value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} placeholder="Is my airport transfer price fixed?" /></label>
            <label className="grid gap-1.5 text-sm font-medium">Answer<Textarea value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} placeholder="Write the approved answer shown on every airport page." /></label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : editingId ? "Update FAQ" : "Add FAQ"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM) }}>Cancel</Button>}
            </div>
            {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Published airport FAQ set</CardTitle><p className="text-sm text-muted-foreground">These approved FAQs appear on every airport page.</p></CardHeader>
        <CardContent className="grid gap-3">
          {faqs.length === 0 && <p className="text-sm text-muted-foreground">No airport FAQs yet.</p>}
          {faqs.map((faq, index) => <article key={faq.id} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">FAQ {index + 1}</p><h3 className="mt-1 font-medium">{faq.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p></div><div className="flex shrink-0 gap-1"><Button type="button" size="sm" variant="outline" onClick={() => edit(faq)}>Edit</Button><Button type="button" size="sm" variant="ghost" onClick={() => remove(faq)}>Delete</Button></div></div></article>)}
        </CardContent>
      </Card>
    </div>
  )
}
