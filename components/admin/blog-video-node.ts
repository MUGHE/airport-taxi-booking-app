import { Node } from "@tiptap/react"
import { parseBlogVideo } from "@/lib/blog-schema"

/** A video block in the article editor. The public page renders it in components/blog/blog-content.tsx. */
export const BlogVideo = Node.create({
  name: "blogVideo",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, title: { default: "" } }
  },
  parseHTML() {
    return [{
      tag: "div[data-blog-video]",
      getAttrs: (element) => ({ src: element.getAttribute("data-src"), title: element.getAttribute("data-title") ?? "" }),
    }]
  },
  renderHTML({ node }) {
    const video = parseBlogVideo(node.attrs.src)
    const player = video?.kind === "embed"
      ? ["iframe", { src: video.url, title: node.attrs.title || "Video" }]
      : ["video", { src: video?.url ?? "", controls: "true", preload: "metadata" }]
    return ["div", { "data-blog-video": "", "data-src": node.attrs.src, "data-title": node.attrs.title, class: "blog-video" }, player]
  },
})
