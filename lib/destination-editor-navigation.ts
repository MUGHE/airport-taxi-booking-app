export type EditorTab = "basic-info" | "seo" | "location" | "hero" | "content" | "faq-trust" | "related" | "publish"

export function blockerTab(code: string): EditorTab {
  if (["invalid-slug", "duplicate-value", "missing-seo-title", "missing-meta-description", "missing-h1"].includes(code)) return "seo"
  if (["incomplete-location", "invalid-terminal", "missing-primary-terminal", "unreviewed-google-place"].includes(code)) return "location"
  if (code === "missing-service-area") return "basic-info"
  if (["missing-supported-airport", "no-bookable-airport", "minimum-related-pages", "invalid-relationships"].includes(code)) return "related"
  if (code === "missing-hero") return "hero"
  if (code === "minimum-faqs") return "faq-trust"
  if (code.startsWith("missing-") || ["invalid-media", "unsafe-link", "missing-link-label", "broken-internal-link"].includes(code)) return "content"
  return "basic-info"
}
