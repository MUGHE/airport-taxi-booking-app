"use client"

import { useRef, useState, type ReactNode } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Bold, Heading2, Heading3, Heading4, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Loader2, Minus, Pilcrow, Quote, Redo2, Undo2, Upload, Video } from "lucide-react"
import { toast } from "react-toastify"
import { BlogVideo } from "@/components/admin/blog-video-node"
import { Button } from "@/components/ui/button"
import { createBlogVideoUploadAction, uploadBlogImageAction } from "@/lib/blog-actions"
import { BLOG_VIDEO_MAX_BYTES, isSafeBlogLink, parseBlogVideo, type BlogPost } from "@/lib/blog-schema"
import type { TiptapDocument } from "@/lib/destination-content"

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <Button type="button" variant={active ? "secondary" : "ghost"} size="icon-sm" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</Button>
}

/** Article editor: H2/H3/H4 headings, paragraphs, lists, quotes, dividers, links, inline images and videos. */
export function BlogRichTextEditor({ value, onChange }: { value: BlogPost["content"]; onChange: (value: TiptapDocument) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [2, 3, 4] }, code: false, codeBlock: false, strike: false, underline: false }),
      BlogVideo,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, protocols: ["https", "mailto", "tel"] }),
      // Pasted or dropped data: URIs are refused; images go through the upload button instead.
      Image.configure({ allowBase64: false }),
    ],
    // A document with no blocks has nowhere to put the cursor, and the first line's formatting gets lost.
    content: value.content.length ? value : "",
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

  function insertVideo(src: string, title: string) {
    if (!editor) return
    // Inserted after the selection with a new paragraph, so the next video doesn't replace this one.
    editor.chain().focus().insertContentAt(editor.state.selection.to, [{ type: "blogVideo", attrs: { src, title: title.trim() } }, { type: "paragraph" }]).run()
  }

  function insertVideoLink() {
    const src = window.prompt("Video link: YouTube, Vimeo, or an https:// link to an MP4 or WebM file", "")
    if (!src?.trim()) return
    if (!parseBlogVideo(src)) return void toast.error("Use a YouTube or Vimeo link, or an https:// link to an MP4 or WebM file.")
    const title = window.prompt("Short video title, for screen readers", "")
    if (title === null) return
    insertVideo(src.trim(), title)
  }

  async function uploadVideo(file: File) {
    if (file.size > BLOG_VIDEO_MAX_BYTES) return void toast.error("Videos must be 50 MB or smaller. Use a YouTube link for longer videos.")
    const title = window.prompt("Short video title, for screen readers", "")
    if (title === null) return
    setUploadingVideo(true)
    try {
      const result = await createBlogVideoUploadAction({ name: file.name, type: file.type, size: file.size })
      if (!result.ok) return void toast.error(result.error)
      const response = await fetch(result.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
      if (!response.ok) return void toast.error("The video could not be uploaded. Please try again.")
      insertVideo(result.url, title)
    } catch {
      toast.error("The video could not be uploaded. Please try again.")
    } finally {
      setUploadingVideo(false)
    }
  }

  if (!editor) return <div className="min-h-80 rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">Loading editor…</div>

  return (
    <div className="space-y-2" data-testid="blog-rich-text-editor">
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/80 p-1 backdrop-blur" role="toolbar" aria-label="Formatting">
        <ToolbarButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-4" /></ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolbarButton>
        <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolbarButton>
        <ToolbarButton label="Heading 4" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}><Heading4 className="size-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="size-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolbarButton>
        <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolbarButton>
        <ToolbarButton label={uploading ? "Uploading image…" : "Insert image"} disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </ToolbarButton>
        <ToolbarButton label="Insert video link (YouTube or Vimeo)" onClick={insertVideoLink}><Video className="size-4" /></ToolbarButton>
        <ToolbarButton label={uploadingVideo ? "Uploading video…" : "Upload video (MP4 or WebM, up to 50 MB)"} disabled={uploadingVideo} onClick={() => videoInput.current?.click()}>
          {uploadingVideo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
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
        <input
          ref={videoInput}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadVideo(file) }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
