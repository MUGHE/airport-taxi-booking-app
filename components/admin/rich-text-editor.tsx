"use client"

import { useEffect, useState, type ReactNode } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { Bold, Heading3, Link as LinkIcon, List, ListOrdered, Pilcrow, Redo2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { blocksToTiptapDocument, isSafeDestinationContentLink, type RichTextBlock, type TiptapDocument } from "@/lib/destination-content"

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <Button type="button" variant={active ? "secondary" : "ghost"} size="icon-sm" aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</Button>
}

export function RichTextEditor({ value, onChange }: { value: RichTextBlock[] | TiptapDocument; onChange: (value: TiptapDocument) => void }) {
  const [initialDocument] = useState(() => Array.isArray(value) ? blocksToTiptapDocument(value) : value)
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false })],
    content: initialDocument,
    immediatelyRender: false,
    editorProps: { attributes: { class: "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-within:ring-3 focus-within:ring-ring/50" } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON() as TiptapDocument),
  })

  useEffect(() => {
    if (!editor) return
    const next = Array.isArray(value) ? blocksToTiptapDocument(value) : value
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  function setLink() {
    if (!editor) return
    const href = window.prompt("Link URL (internal path or HTTPS URL)", editor.getAttributes("link").href || "/book")
    if (href === null) return
    const trimmed = href.trim()
    if (!isSafeDestinationContentLink(trimmed)) {
      window.alert("Links must use an internal path or HTTPS.")
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run()
  }

  if (!editor) return <div className="min-h-28 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">Loading editor…</div>

  return <div className="space-y-2" data-testid="rich-text-editor">
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
      <ToolbarButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-4" /></ToolbarButton>
      <ToolbarButton label="Heading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolbarButton>
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="size-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolbarButton>
      <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolbarButton>
    </div>
    <EditorContent editor={editor} />
  </div>
}
