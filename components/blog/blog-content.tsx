import Link from "next/link"
import type { ReactNode } from "react"
import { isSafeBlogImageSrc, isSafeBlogLink, slugify } from "@/lib/blog-schema"
import type { TiptapDocument, TiptapNode } from "@/lib/destination-content"

function text(node: TiptapNode): string {
  return node.text ?? (node.content ?? []).map(text).join("")
}

function renderInline(node: TiptapNode, key: number): ReactNode {
  if (node.type === "hardBreak") return <br key={key} />
  if (node.type !== "text") return null
  let result: ReactNode = node.text
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") result = <strong>{result}</strong>
    if (mark.type === "italic") result = <em>{result}</em>
    if (mark.type === "link" && isSafeBlogLink(mark.attrs?.href)) {
      const href = mark.attrs.href
      // Internal links stay in the app; external ones open safely in a new tab.
      result = href.startsWith("/")
        ? <Link href={href}>{result}</Link>
        : <a href={href} {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{result}</a>
    }
  }
  return <span key={key}>{result}</span>
}

function renderBlock(node: TiptapNode, key: number): ReactNode {
  const children = (node.content ?? []).map((child, index) => (child.type === "text" || child.type === "hardBreak" ? renderInline(child, index) : renderBlock(child, index)))
  switch (node.type) {
    case "paragraph":
      return children.length ? <p key={key}>{children}</p> : null
    case "heading": {
      // Headings get anchors so articles can link to a section (#where-to-meet-your-driver).
      const id = slugify(text(node)) || undefined
      return node.attrs?.level === 3 ? <h3 key={key} id={id}>{children}</h3> : <h2 key={key} id={id}>{children}</h2>
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>
    case "orderedList":
      return <ol key={key} start={typeof node.attrs?.start === "number" ? node.attrs.start : undefined}>{children}</ol>
    case "listItem":
      return <li key={key}>{children}</li>
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>
    case "horizontalRule":
      return <hr key={key} />
    case "image":
      return isSafeBlogImageSrc(node.attrs?.src)
        // eslint-disable-next-line @next/next/no-img-element -- inline article images come from editors at any size
        ? <img key={key} src={node.attrs.src} alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""} loading="lazy" decoding="async" />
        : null
    default:
      return null
  }
}

/** Renders a sanitised Tiptap document as article HTML, styled by `.blog-prose`. */
export function BlogContent({ document }: { document: TiptapDocument }) {
  return <div className="blog-prose">{document.content.map(renderBlock)}</div>
}
