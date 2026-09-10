# 09: Add secure Full Preview using the production template

**What to build:** Give the Administrator one compact Full Preview button that opens an accurate full-page Draft using the same renderer as the Published Page, without making unpublished content discoverable.

**Blocked by:** 05: Build the structured content editor and Draft saving; 06: Add signed Cloudinary image uploads and asset selection; 07: Add reusable Service Facts, FAQs, and verified reviews; 08: Add bidirectional Related Routes and booking prefill.

**Status:** ready-for-agent

- [ ] The editor shows a single Full Preview button and no permanent or embedded preview panel.
- [ ] Preview opens the complete responsive page in a separate tab.
- [ ] Preview renders through the production Airport Page renderer rather than a second approximate template.
- [ ] Preview includes Draft sections, selected media, facts, FAQs, reviews, routes, terminals, map, fleet, and booking configuration.
- [ ] An unauthenticated request cannot view or infer Full Preview content.
- [ ] Preview responses are marked non-indexable and excluded from sitemap/discovery.
- [ ] Preview makes clear when changes have not yet been saved.
- [ ] Browser tests cover the Full Preview button, authenticated access, unauthenticated denial, responsive widths, and parity of representative content with the public renderer.
