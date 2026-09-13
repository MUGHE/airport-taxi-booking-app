# 05: Build the structured content editor and Draft saving

**What to build:** Let the Admin compose an Airport Page from safe, controlled Content Sections, explicitly save it as a Draft, and continue editing without changing any public content.

**Blocked by:** 04: Add the admin Destination Pages list and Airport identity editor.

**Status:** ready-for-agent

- [ ] The hero/quote area remains fixed first and the final booking CTA remains fixed last.
- [ ] The editor uses focused tabs in this order: Basic info, SEO, Location, Hero, Content, FAQ & trust, Related, and Publish.
- [ ] The Content tab presents a flat page structure and opens only the selected Content Section editor, without nested accordions or a stack of rich-text editors.
- [ ] The editor supports the approved introduction, benefits, reviews, fleet/pricing, airport routes, Airport Guide, city routes, ferry/cruise, travel information, FAQ, video, map, and related-destination section types.
- [ ] The Admin can add, edit, hide, show, remove, and reorder optional middle Content Sections.
- [ ] Required sections cannot be hidden or removed and explain why when an invalid action is attempted.
- [ ] Rich text is limited to headings, paragraphs, bold, lists, and links; executable or custom-styled markup cannot be stored or rendered.
- [ ] Related Route links select stable known pages; rich-text internal links use known fixed site paths, while external links require HTTPS and a visible label.
- [ ] The structured Airport Guide exposes the approved optional subfields and keeps editorial source/verification notes private.
- [ ] Save Draft is explicit, survives reload, records the schema version, and never modifies the current Published Snapshot.
- [ ] Leaving with unsaved changes triggers a warning; saving clears the dirty state.
- [ ] The editor gives word-count guidance without padding content or enforcing a hard word-count rule.
- [ ] Browser coverage proves section ordering, visibility, safe formatting, explicit saving, reload, and draft isolation.
