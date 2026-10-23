"use client"

import { useRef, useState, type ReactNode } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Loader2, Pilcrow, Quote, Redo2, Undo2 } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { uploadBlogImageAction } from "@/lib/blog-actions"
import { isSafeBlogLink, type BlogPost } from "@/lib/blog-schema"
import type { TiptapDocument } from "@/lib/destination-content"

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <Button type="button" variant={active ? "secondary" : "ghost"} size="icon-sm" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</Button>
}

/** Article editor: H2/H3 headings, paragraphs, lists, quotes, links and inline images. */
export function BlogRichTextEditor({ value, onChange }: { value: BlogPost["content"]; onChange: (value: TiptapDocument) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [2, 3] }, code: false, codeBlock: false, strike: false, underline: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, protocols: ["https", "mailto", "tel"] }),
      // Pasted or dropped data: URIs are refused; images go through the upload button instead.
      Image.configure({ allowBase64: false }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { class: "blog-prose blog-editor-surface min-h-80 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus-within:ring-3 focus-within:ring-ring/50" } },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as TiptapDocument),
  })

  function setLink() {
    if (!editor) return
    const href = window.prompt("Link URL — an internal path like /airport-transfers/heathrow-airport-taxi, or an https:// address", editor.getAttributes("link").href || "/")
    if (href === null) return
    const trimmed = href.trim()
    if (!trimmed) return void editor.chain().focus().extendMarkRange("link").unsetLink().run()
    if (!isSafeBlogLink(trimmed)) return void toast.error("Links must be an internal path (starting with /) or an https:// address.")
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run()
  }

  async function insertImage(file: File) {
    if (!editor) return
    const alt = window.prompt("Describe the image for screen readers and Google (alt text)", "")
    if (alt === null) return
    setUploading(true)
    const form = new FormData()
    form.set("file", file)
    const result = await uploadBlogImageAction(form)
    setUploading(false)
    if (!result.ok) return void toast.error(result.error)
    editor.chain().focus().setImage({ src: result.url, alt: alt.trim() }).run()
  }

  if (!editor) return <div className="min-h-80 rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">Loading editor…</div>

  return (
    <div className="space-y-2" data-testid="blog-rich-text-editor">
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/80 p-1 backdrop-blur" role="toolbar" aria-label="Formatting">
        <ToolbarButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-4" /></ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolbarButton>
        <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="size-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolbarButton>
        <ToolbarButton label={uploading ? "Uploading image…" : "Insert image"} disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolbarButton>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void insertImage(file) }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
