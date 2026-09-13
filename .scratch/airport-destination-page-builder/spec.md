# Airport Destination Page Builder

Status: ready-for-agent

## Problem Statement

The website currently has six Airport Pages whose airport details, terminal data, page copy, links, SEO metadata, and sitemap entries are maintained in code. Adding or improving an airport therefore requires a developer and a deployment. The current public design is clean and usable, but it has too little unique, airport-specific content to support the intended search experience or to answer common customer questions before booking.

The business needs a safe admin-managed Page Builder that lets one trusted Administrator add airports one at a time, write unique content, preview it at common screen widths, and publish it without exposing unfinished work. The result should retain the current ONE Airport Taxi brand and booking journey while supporting useful, in-depth Destination Page content. altCABS is a reference for content coverage only; its design or wording must not be copied.

The supplied marketing workbook identifies 31 airport opportunities on Sheet 6. Five overlap with the current airport set and Southend is already on the website, so completing that sheet would add 26 new airports and produce 32 airport pages in total. Bulk spreadsheet import is not part of this release; the administrator will create and review each page individually.

The feature must also solve several operational risks:

- A draft edit must never replace the currently published page until the administrator explicitly publishes it.
- Public URLs must be readable and stable, such as `/airport-transfers/aberdeen-airport-taxi`.
- Existing airport URLs must continue working through permanent redirects.
- Publishing must prevent broken, incomplete, or duplicate pages.
- Airport and terminal data used by the page and the booking form must remain consistent.
- Images must be safely managed through Cloudinary without exposing account secrets.
- Search engines must see only valid published pages, canonical URLs, useful metadata, and an accurate sitemap.
- If an external service fails, customers must still see the last safe published content and a practical way to continue.

## Solution

Build a structured Destination Page Builder inside the existing admin area. The first released editor supports Airport Pages. The underlying model may recognize a future City/Town Page type, but no City/Town editor or public route is delivered in this scope.

An Airport Page is assembled from controlled sections rather than an unrestricted drag-and-drop canvas. The hero and quote form are fixed at the top, and the final booking call-to-action is fixed at the bottom. Between them, the administrator can add, edit, hide, remove, and reorder allowed section types. Required sections cannot be hidden or removed. This gives the editor flexibility while keeping every page consistent, responsive, safe, and easy to maintain.

The normal workflow is:

1. The administrator opens the Destination Pages list and creates an Airport Page.
2. The Administrator completes airport identity, Google location, terminal, slug, image, content, Related Routes, and SEO fields.
3. Save Draft stores work without changing the public page.
4. Preview renders the draft with the real production template at desktop, tablet, and mobile widths.
5. Publish validation separates blocking errors from warnings.
6. A successful publish atomically replaces the public snapshot, retains the immediately previous published snapshot for recovery, and refreshes affected public pages, lists, redirects, and sitemap data.
7. Later edits create or update a draft while the existing published snapshot remains live.
8. Archiving removes a page from discovery and sends its old URL to a selected relevant published replacement, with the airport index as the fallback.

The first implementation migrates the six existing airport pages into Supabase before the public page switches away from hardcoded data. Their current content remains available throughout the migration. Their old URLs permanently redirect to the new SEO-friendly slugs.

The public Airport Page keeps the current ONE visual language and booking behavior, but supports richer content: a hero quote form, airport introduction, benefits, verified reviews, live fleet/pricing, popular routes, an Airport Guide, optional ferry/cruise information, travel information, airport-specific FAQs, optional video, a lightweight Map Preview, Related Routes, and a final call-to-action. Content should normally reach roughly 1,200–2,000 useful words, but word count is guidance rather than a Publish Blocker. Unique, accurate, useful content matters more than length.

## User Stories

1. As an Administrator, I want a Destination Pages item in the existing admin navigation, so that I can manage Destination Pages without developer help.
2. As an Administrator, I want the Destination Pages list to show name, slug, type, status, featured state, and last-updated time, so that I can understand the content estate at a glance.
3. As an Administrator, I want to search pages by airport name or slug, so that I can quickly find the page I need.
4. As an Administrator, I want to filter pages by type, status, and featured state, so that a growing page list remains manageable.
5. As an Administrator, I want to create an Airport Page from a guided editor, so that I know which information is needed and in what order.
6. As an Administrator, I want Airport Page to be the only selectable page type in this release, so that unfinished City/Town functionality cannot be used accidentally.
7. As an Administrator, I want to enter the official airport name and a shorter display name, so that formal data and customer-facing wording can differ safely.
8. As an Administrator, I want to enter the airport's three-letter IATA code, so that customers can recognize the correct airport.
9. As an Administrator, I want duplicate IATA codes to be blocked, so that two pages cannot represent the same airport accidentally.
10. As an Administrator, I want to define the airport's service area, so that its regional context can appear in useful content and listings.
11. As an Administrator, I want to select the airport through Google Places, so that the location starts with reliable address and coordinate data.
12. As an Administrator, I want to review the selected place, latitude, and longitude, so that I can catch an incorrect Google result before publishing.
13. As an Administrator, I want to add one or more terminals or pickup locations, so that the booking form can match the airport's real structure.
14. As an Administrator, I want to edit terminal display names, so that customer wording can be clearer than a provider's raw place name.
15. As an Administrator, I want one terminal or location to be the primary choice, so that the quote form has a predictable default.
16. As an Administrator, I want single-terminal airports to use a simple Main Terminal entry, so that the data model does not force artificial complexity.
17. As an Administrator, I want the system to suggest a slug ending in `-airport-taxi`, so that new URLs follow one SEO-friendly pattern.
18. As an Administrator, I want a suggested slug to use lowercase letters, numbers, and single hyphens only, so that URLs remain readable and valid.
19. As an Administrator, I want to edit the suggested slug before first publication, so that I can correct uncommon airport naming.
20. As an Administrator, I want duplicate slugs to be blocked, so that every public URL identifies exactly one page.
21. As an Administrator, I want a published slug change to create a permanent redirect from the previous slug, so that bookmarks and search value are preserved.
22. As an Administrator, I want Save Draft to be an explicit action, so that I control when unfinished changes are stored.
23. As an Administrator, I want a warning before leaving with unsaved changes, so that I do not lose work by accident.
24. As an Administrator, I want edits to a published page to remain a separate draft, so that visitors continue seeing the last approved version.
25. As an Administrator, I want to see whether a page has unpublished changes, so that I know which pages still need review.
26. As an Administrator, I want the editor to keep the hero and quote form fixed at the top, so that the main conversion action is always prominent.
27. As an Administrator, I want the final call-to-action fixed at the bottom, so that every content journey ends with a clear next step.
28. As an Administrator, I want to add, remove, hide, show, and reorder allowed middle sections, so that each airport page can reflect its useful available content.
29. As an Administrator, I want required sections to be protected from removal or hiding, so that a page cannot lose its essential booking and information experience.
30. As an Administrator, I want a limited text editor with headings, paragraphs, bold text, lists, and links, so that I can format readable content without breaking the site design.
31. As an Administrator, I want raw HTML, scripts, custom fonts, and custom colours to be unavailable, so that unsafe or visually inconsistent content cannot be inserted.
32. As an Administrator, I want internal links selected from known pages, so that the system can validate them and reduce typing mistakes.
33. As an Administrator, I want external links to require HTTPS and a visible label, so that visitors get safer and clearer links.
34. As an Administrator, I want external links to open in a new tab, so that visitors can return easily to the booking page.
35. As an Administrator, I want a structured Airport Guide with optional fields for airport overview, terminals, pickup/drop-off, meeting points, waiting/parking, accessibility, hotels, food/shopping, and an official airport link, so that important facts are complete but easy to maintain.
36. As an Administrator, I want internal source and verification notes for factual claims, so that content can be reviewed later without showing editorial notes to customers.
37. As an Administrator, I want centrally managed Service Facts for waiting time, cancellation, flight tracking, meet-and-greet, and support, so that important promises stay consistent across pages.
38. As an Administrator, I want to choose which approved Service Facts appear on an airport page, so that the page remains relevant without rewriting company policy.
39. As an Administrator, I want reusable global FAQs and airport-specific FAQs, so that shared answers and local answers can coexist.
40. As an Administrator, I want at least three airport-specific FAQs before publishing, so that each page answers genuine local questions rather than repeating generic text.
41. As an Administrator, I want verified reviews selected from a central review library, so that I never invent airport-specific testimonials.
42. As an Administrator, I want a review section to be optional, so that missing suitable reviews do not block an otherwise useful page.
43. As an Administrator, I want vehicle names, capacities, images, and prices to come from the existing fleet and pricing system, so that I do not create conflicting fare information inside page content.
44. As an Administrator, I want to select related Published Pages, so that visitors can discover useful nearby routes and destinations.
45. As an Administrator, I want a related relationship to work in both directions, so that connected pages do not require duplicate manual setup.
46. As an Administrator, I want each direction of a related relationship to support its own heading and description, so that the wording reads naturally on both pages.
47. As an Administrator, I want archived or draft-only pages excluded from related-page selection, so that I cannot create broken public links.
48. As an Administrator, I want to upload airport images directly to Cloudinary, so that media does not depend on a local deployment.
49. As an Administrator, I want image uploads limited to JPG, PNG, WebP, or AVIF and 8 MB per action, so that unsupported or excessively large files are rejected clearly.
50. As an Administrator, I want hero images checked for a 16:9 shape and at least 1600-pixel width, so that they remain sharp on large screens.
51. As an Administrator, I want section images checked for a supported 4:3 or 16:9 shape, so that page layouts remain consistent.
52. As an Administrator, I want every used image to have alt text, source or owner, a licence note, upload date, and a rights confirmation, so that accessibility and usage rights are not forgotten.
53. As an Administrator, I want to reuse an existing media asset, so that the same approved image is not uploaded repeatedly.
54. As an Administrator, I want removing an image from a page to leave the media asset intact, so that another page using it is not damaged.
55. As an Administrator, I want permanent media deletion allowed only when the asset is unused and after confirmation, so that live pages cannot lose images accidentally.
56. As an Administrator, I want one compact Full Preview button instead of a permanent preview panel, so that the editor stays focused and short.
57. As an Administrator, I want the preview to use the responsive production template, so that I can check the page at the browser width I need.
58. As an Administrator, I want the Full Preview button to open the complete page in a new tab, so that I can review the complete customer journey.
59. As an Administrator, I want Full Preview protected by admin authentication and excluded from indexing, so that unfinished pages are not publicly discoverable.
60. As an Administrator, I want to edit SEO title, meta description, H1, slug, and social preview content, so that each airport has a clear search result.
61. As an Administrator, I want a search-result preview, so that I can spot unclear or truncated-looking metadata before publishing.
62. As an Administrator, I want duplicate SEO titles to block publication, so that pages do not compete with indistinguishable titles.
63. As an Administrator, I want missing required identity, terminal, content, image, related destination, map, FAQ, CTA, and SEO data to block publication, so that incomplete pages cannot go live.
64. As an Administrator, I want broken internal links to block publication, so that customers do not land on missing pages.
65. As an Administrator, I want similar meta descriptions, long repeated passages, and reused hero images to appear as warnings, so that I can improve uniqueness without being prevented from publishing for a justified reason.
66. As an Administrator, I want warnings to require an explicit override confirmation, so that they are acknowledged rather than silently ignored.
67. As an Administrator, I want publication to succeed completely or not at all, so that a partial update cannot leave the page in an inconsistent state.
68. As an Administrator, I want publication to take effect immediately after success, so that no separate scheduling workflow is needed.
69. As an Administrator, I want only the immediately previous Published Snapshot retained, so that I have a simple recovery point without a complex version archive.
70. As an Administrator, I want to restore the previous Published Snapshot as a new draft, so that I can review it before replacing the live page again.
71. As an Administrator, I want to archive a published page rather than hard-delete it, so that its old URL and search history can be handled safely.
72. As an Administrator, I want archiving to require a relevant published replacement page, with the airport index available as a fallback, so that old links have a useful permanent destination.
73. As an Administrator, I want a never-published draft to be deletable after confirmation, so that abandoned experiments do not clutter the admin area.
74. As an Administrator, I want booking availability to be separate from publication status, so that a temporarily unavailable airport page can stay informative and offer contact help.
75. As an Administrator, I want a permanently closed service to be archived, so that it stops appearing in public discovery.
76. As an Administrator, I want no more than six airport pages marked Featured, so that header and homepage navigation remain compact.
77. As an Administrator, I want a clear error when I try to feature a seventh airport, so that the limit is predictable.
78. As the trusted Administrator, I want every create, update, upload-signing, publish, restore, archive, redirect, and delete action to verify my admin session on the server, so that knowing a private endpoint is not enough to change content.
79. As a Customer, I want the airport page hero to contain a compact working quote form, so that I can start booking without searching for another page.
80. As a Customer, I want the airport preselected in the quote form, so that I enter only the other end of my journey.
81. As a Customer, I want to switch between travelling to and from the airport, so that the same page supports departures and arrivals.
82. As a Customer, I want to select the correct terminal when an airport has several, so that my quote and pickup instructions use the right place.
83. As a Customer, I want a related-route Get fixed price action to prefill both locations, so that I can quote a common journey in one step.
84. As a Customer, I want fleet cards to use current global pricing and capacity information, so that page content matches the booking journey.
85. As a Customer, I want useful airport-specific guidance, so that I can understand meeting points, terminals, accessibility, waiting, and onward travel before booking.
86. As a Customer, I want a lightweight map preview that opens Google Maps when selected, so that the page stays fast but I can still inspect the location.
87. As a Customer, I want a text address and maps link when the map preview fails, so that I can still locate the airport.
88. As a Customer, I want a branded placeholder and useful alt text when an image fails, so that the page remains understandable.
89. As a Customer, I want a link to the main booking page and a contact option if the embedded quote form fails, so that I am not trapped.
90. As a Customer, I want the last safe Published Snapshot when the content database has a temporary problem, so that a short outage does not expose a draft or remove a working page.
91. As a Customer, I want a clear service error with Retry when neither live data nor a safe cached snapshot is available, so that the site does not pretend the airport is missing.
92. As a Customer using an old airport URL, I want a permanent redirect to its current SEO-friendly URL, so that my bookmark still works.
93. As a Customer using an unknown, draft, or archived slug without a redirect, I want a real not-found response, so that I am not silently sent to an unrelated airport.
94. As a Customer, I want the airport index to list all published airports alphabetically, so that I can browse the complete service area.
95. As a Customer, I want to search the airport index by airport name, code, or served area, so that I can find an airport quickly.
96. As a Customer, I want the header dropdown to show the six featured airports plus View all, so that common choices are quick without creating an oversized menu.
97. As a Customer, I want the page to work with keyboard controls, visible focus, readable contrast, and meaningful labels, so that I can use it with different access needs.
98. As a Customer, I want the complete page and quote journey to work on mobile, tablet, and desktop, so that my device does not limit booking.
99. As a Search Visitor, I want a unique title, description, H1, canonical URL, and useful page content, so that I can understand the result before opening it.
100. As a Search Engine, I want only Published Pages in the sitemap, so that drafts, previews, archived pages, and redirect-only URLs are not treated as current content.
101. As a Search Engine, I want permanent redirects for replaced slugs, so that signals consolidate onto the current canonical page.
102. As a Search Engine, I want breadcrumb and airport/service structured data based on published facts, so that the page's context is machine-readable without misleading review claims.
103. As a Search Engine, I want global organisation information reused consistently, so that each page does not invent a separate business identity.
104. As a Business Owner, I want the six existing airport pages migrated without downtime, so that current visitors and search traffic are protected.
105. As a Business Owner, I want airport page views, quote starts, quote completions, and booking handoffs tagged by airport slug in Vercel Analytics, so that I can compare page performance later.
106. As a Business Owner, I want the editor and public content to be English-only in this release, so that translation complexity does not delay the first useful version.
107. As a Business Owner, I want airports added individually from the researched list, so that every page receives a human accuracy and uniqueness review.

## Implementation Decisions

### Product boundary

- Deliver one structured Airport Page template and its management workflow. Do not build an unrestricted visual canvas.
- Preserve the existing ONE Airport Taxi design system, navigation, fleet cards, pricing source, and booking flow. Use the altCABS page only to understand useful content coverage.
- Represent destination type in the domain so a future City/Town Page can be introduced without reshaping Airport Page records. Do not expose or implement that future editor now.
- Keep the implementation DRY, KISS, and YAGNI: shared rules should have one owner, the public renderer and preview should share the same template, and future-only features should not be built.

### Content ownership and data shape

- Supabase is the single source of truth for destination content after migration. Remove runtime dependence on the hardcoded airport content collection only after migration verification succeeds.
- Model a stable Destination Page identity separately from editable Draft content and the current Published Snapshot. Retain at most one previous Published Snapshot for recovery.
- Store ordered page sections as validated structured content, not arbitrary HTML. Every section has a known type, stable identifier, visibility, order, and type-specific fields.
- Keep query-critical and integrity-critical data relational: airport identity, IATA code, lifecycle state, booking availability, current slug, featured state, terminals, redirects, related-page links, media references, global facts, global FAQs, and publication timestamps.
- Keep page prose and structured section bodies in the draft/published content document when relational querying adds no value.
- Store internal editorial sources and verification notes separately from public rendered content.
- Store an explicit schema version with structured content so future migrations can be performed safely.
- Use database constraints where possible for exact uniqueness and referential integrity, backed by friendly application-level validation messages.

### Lifecycle and publication

- Use Draft, Published, and Archived as lifecycle states. Track booking availability separately.
- Saving a draft never mutates the current Published Snapshot.
- Publishing performs validation and all state changes in one database transaction. If any required change fails, the previous published state remains untouched.
- A publish copies the validated draft into the current Published Snapshot, moves the former current snapshot into the single recovery slot, records publication metadata, and clears the unpublished-changes indicator.
- Restore never publishes immediately. It copies the recovery snapshot into Draft for review.
- Do not autosave. Provide explicit Save Draft and navigation protection for dirty forms.
- Do not implement scheduled publishing, approval chains, multiple editors, or a long version history.

### Airport identity, location, and terminals

- Require official name, display name, unique three-letter IATA code, service area, Google Place selection, latitude, longitude, at least one terminal/location, current slug, hero image, and primary terminal/location before first publication.
- Save the stable Google place identifier alongside the display address and coordinates. Allow the administrator to review coordinates and edit customer-facing terminal names.
- Order terminals explicitly and require exactly one primary terminal/location for the default quote-form selection.
- Reuse the same published airport and terminal records for page rendering and booking prefill. Do not maintain a second terminal list inside page prose.

### URLs, slugs, and redirects

- Airport pages live at `/airport-transfers/{slug}`.
- Generate the default slug from the chosen airport name with a required `-airport-taxi` suffix. Normalize to lowercase ASCII where practical, use single hyphens, remove leading/trailing hyphens, and reject empty or duplicate results.
- Slugs may be edited freely before first publication. A published slug is stable unless the administrator deliberately changes it.
- Every published slug change writes a permanent redirect from the old airport path to the new canonical path. Redirect chains must be collapsed to the final current destination, and redirect loops must be rejected.
- Seed permanent redirects for the six current paths: `heathrow`, `gatwick`, `stansted`, `luton`, `london-city`, and `southend`, each pointing to its corresponding `-airport-taxi` slug.
- Unknown slugs, draft-only slugs, and archived slugs return not found unless an explicit redirect record exists. Do not use fuzzy matching or a catch-all redirect.
- Reserve `/destinations/{city}-taxi` as the recommended future City/Town convention, without implementing it in this release.

### Page composition

- Fix the branded hero, compact quote form, and airport identity at the top. Fix the final booking call-to-action at the bottom.
- Support controlled middle-section types for introduction, benefits/service facts, reviews, fleet/pricing, airport routes, Airport Guide, popular city routes, optional ferry/cruise information, travel information, FAQs, optional approved video, map, and Related Routes.
- Required publish content is: hero heading, useful introduction, hero image, working Airport Quote Form configuration, benefits, fleet, main service description, Airport Guide, at least three airport-specific FAQs, map/location data, at least three valid Related Routes, final CTA, SEO title, and meta description.
- Reviews, video, ferry/cruise routes, hotels, food/shopping, and other explicitly optional guide fields do not block publication.
- Treat 1,200–2,000 useful words as editorial guidance. Do not pad thin pages or enforce a hard word-count blocker.
- Use a constrained rich-text data format that allows headings, paragraphs, bold, lists, and links. Sanitize output and never store executable markup supplied by an administrator.
- Related Route links reference stable page identities rather than copied URL strings. Rich-text internal links are limited to known fixed site paths. External links require HTTPS, a non-empty label, and safe new-tab behavior.

### Global reusable content

- Maintain Global Service Facts separately from pages for waiting policy, cancellation, flight tracking, meet-and-greet, and support. An Airport Page selects facts but cannot rewrite their official wording locally.
- Support reusable Global FAQs and separate page-specific FAQs. Require at least three page-specific FAQs for publication.
- Keep fleet cards connected to the existing global fleet and live pricing configuration. Page content may choose presentation/context but cannot override vehicle facts or prices.
- Support a central verified-review library as display data. Airport Pages can select appropriate reviews. Do not generate review structured data or make location-specific claims that the review source does not support.
- A full review-management product is a later enhancement; this release needs only the minimum selection/read capability needed by Airport Pages.

### Related Routes and booking handoff

- Relate stable Published Page identities, never free-text paths. Only published, non-archived destinations are selectable.
- Store one bidirectional relationship with independent presentation content for each direction. Removing the relationship removes it from both public pages.
- A related card's destination name opens the related page. Its Get fixed price action opens the existing booking experience with both airport and destination locations prefilled.
- Do not create separate airport-to-airport Destination Pages in this release.
- In the hero quote form, preselect the page airport's primary terminal/location, allow terminal choice where relevant, and support both to-airport and from-airport direction.

### Media and Cloudinary

- Use Cloudinary for managed Airport Page media. The public cloud name may be exposed to the browser; API key handling and the API secret remain server-controlled, with the secret never included in browser code, logs, or database content.
- Use a short-lived, narrowly scoped signed upload request created only after server-side admin authentication. Do not expose an unsigned upload preset that permits unrestricted writes.
- Accept one JPG, PNG, WebP, or AVIF file per upload action, up to 8 MB.
- Validate hero images as 16:9 and at least 1600 pixels wide. Validate content images as 4:3 or 16:9. Explain validation failures in plain language.
- Record Cloudinary asset identity, dimensions, format, secure delivery URL, alt text, source/owner, licence note, upload date, and administrator rights confirmation.
- Deliver responsive image sizes with automatic format and quality optimisation.
- Detaching media from a page does not delete it. Permanent deletion is available in a basic Media Library only when no draft or published content references the asset, requires confirmation, deletes the Cloudinary asset, and invalidates cached delivery.
- Migrate current airport images into the managed media approach before cutting the six existing pages over to the database source.
- Configure the application image allowlist narrowly for the Cloudinary delivery host in use.

### Admin experience and security

- Extend the existing shared-password admin session rather than introducing roles or multiple user accounts in this release.
- Every mutation and upload-signing operation verifies the signed admin session on the server. UI hiding is not an authorization control.
- Validate and normalize all submitted data on the server even when equivalent browser validation exists.
- Protect Full Preview routes with the same admin session. Mark previews and all non-published content as non-indexable.
- The list screen provides Create, Edit, Preview, Publish, Restore where available, and Archive actions. Do not add a Duplicate Page action.
- The editor uses a focused tabbed workspace for Basic info, SEO, Location, Hero, Content, FAQ and trust content, Related Pages, and Publish while preserving a visible Save Draft action.
- The Content tab shows a flat page structure and only one active Content Section editor. Do not stack every rich-text editor or nest accordions.
- Preview is a single compact button that opens the full private preview in a new tab. It uses the same public renderer and responsive styles as production. Do not embed a second approximate preview template in the editor.
- Publish validation groups Blocking Errors and Warnings. Warnings require an explicit confirmation to proceed; blockers cannot be overridden.
- Enforce a maximum of six Featured Airport Pages across header and homepage placement.

### Publish validation

- Block publication for duplicate slug, duplicate SEO title, duplicate IATA code, invalid slug shape, missing required airport identity, missing location/coordinates, no terminal, no primary terminal, missing required content/section, fewer than three airport-specific FAQs, fewer than three valid Related Routes, missing image rights or alt text, missing SEO title/description, unsafe external link, broken internal link, or an invalid archived/draft relationship.
- Warn for materially similar meta descriptions, substantial repeated prose, or a hero image already used as another page's hero.
- Duplicate and similarity checks compare against the current Published Pages and other relevant drafts so a conflict is caught before it becomes public.
- Make warning reasons visible and record that the administrator deliberately overrode them as part of the publish audit data.

### Public delivery, discovery, and SEO

- Resolve public Airport Pages from the current Published Snapshot. Do not depend only on a build-time static list; a newly published page must become available without changing source code.
- Use cache/revalidation suitable for fast public reads. A successful publish, slug change, related-page change, featured change, global-fact change, FAQ change, archive, or redirect update invalidates every affected public path and list.
- Generate the airport index from Published Pages, ordered alphabetically, with search by airport name, IATA code, and service area.
- Show no more than six Featured Airport Pages in the header and homepage, plus a View all link to the complete airport index.
- Build canonical URL, social metadata, breadcrumb data, and airport/service structured information from the Published Snapshot. Reuse one global organisation identity.
- Include only current Published Page canonical URLs in the sitemap. Exclude drafts, previews, archived pages, and redirect-source URLs.
- Do not output review/rating structured data unless a later legal and search-policy review establishes that the source and display qualify.
- Render customer pages in English only for this release.

### Availability, fallback, and resilience

- Keep lifecycle state and booking availability independent. A published but temporarily unavailable airport remains visible, explains that online booking is unavailable, and offers the configured contact route.
- A permanently discontinued page is Archived and redirected according to the archive workflow.
- Serve a safe cached Published Snapshot during a temporary Supabase read failure. Never fall back to draft content.
- If no safe published cache exists, return a clear service error with Retry rather than a false not-found page.
- If a map cannot load, show the published address and a Google Maps link.
- If an image cannot load, show a branded placeholder without collapsing the layout.
- If the embedded quote form fails, keep page content visible and offer the main booking route and contact option.

### Migration and release order

- Add the content model and constraints before switching any public read path.
- Seed all six existing airports with stable page identities, location/terminal records, Published Snapshots, matching Drafts, managed media, canonical `-airport-taxi` slugs, and legacy redirects.
- Verify each migrated draft in the production renderer and compare customer-visible facts, booking prefill, metadata, and responsive layout with the current live page.
- Switch public Airport Page reads, airport index, featured navigation, metadata, and sitemap to Supabase only after all six migrated records pass verification.
- Remove the hardcoded content source only after the database-backed path and fallback are proven.
- Deliver in this order: data model and migrations; six-page migration; public database-backed rendering and redirects; admin list; guided editor; draft/published lifecycle; Cloudinary media; preview; publish validation; A–Z index and featured navigation; related routes; global facts and FAQs; analytics; automated tests and responsive verification.
- Add the remaining workbook airports manually, one per reviewed admin workflow, after the builder itself is stable. Do not implement Excel import now.

### Analytics and observability

- Add Vercel Analytics events for airport page view, quote start, quote completion, and booking handoff. Tag each event with the stable page identity and current airport slug.
- Record publication, warning override, restoration, slug change, and archive timestamps with the trusted administrator identity available from the current auth model.
- Log operational failures without storing admin secrets, Cloudinary signatures, customer journey details beyond existing policy, or unpublished content unnecessarily.

## Testing Decisions

The repository has no existing automated test suite that establishes a prior pattern. Use the already installed Playwright test runner for both browser-level behaviour and small pure-rule tests, avoiding a second test framework unless implementation exposes a concrete need.

The primary seam is a browser-level end-to-end flow through the real admin UI, server boundary, test Supabase database, public renderer, and booking prefill. Tests should assert what an administrator or customer can observe, not internal component structure or private helper calls.

Cover these end-to-end behaviours:

- An authenticated administrator can create an Airport Page, select a Google-place test fixture, add terminals, complete required sections, save a draft, preview it, and publish it.
- An unauthenticated visitor cannot open Full Preview or perform any content, media-signing, publish, restore, archive, redirect, or delete action.
- Saving edits to a Published Page leaves the old Published Snapshot visible publicly until Publish succeeds.
- Unsaved changes produce a leave warning, while Save Draft removes that warning and survives a reload.
- The Full Preview button opens the production template in a new tab, and the preview remains usable at desktop, tablet, and mobile widths.
- Each required publish blocker is presented clearly and prevents public changes.
- Warnings require an explicit override and a cancelled override leaves the existing public page unchanged.
- A successful publish updates the public page, metadata, related affected pages, airport index, featured navigation when relevant, and sitemap as one completed outcome.
- A forced publish failure leaves all previously published customer behaviour unchanged.
- A published slug change makes the new canonical URL work and permanently redirects the old URL.
- The six seeded legacy airport paths permanently redirect to their new `-airport-taxi` paths.
- Unknown, draft-only, and archived slugs without redirect records return not found.
- Archiving requires/selects a published replacement, removes the page from discovery and sitemap, and redirects the old URL.
- A never-published draft can be deleted after confirmation, while a Published Page cannot be hard-deleted.
- Restoring the previous Published Snapshot creates a draft and does not immediately change the public page.
- A seventh Featured Airport is rejected and the header/homepage never render more than six.
- The A–Z index includes only Published Pages, sorts them correctly, and searches by name, code, and service area.
- The hero quote form starts with the correct airport/primary terminal and supports both journey directions.
- A related-route price action reaches the booking flow with both locations prefilled.
- Related connections appear in both directions with their direction-specific copy and cannot point to draft or archived pages.
- Fleet cards reflect the existing global pricing source rather than page-local values.
- Map, image, quote-form, and Supabase failure simulations produce the specified customer fallbacks without exposing draft content.
- Temporarily unavailable Published Pages remain visible and offer contact help; Archived Pages do not remain discoverable.
- Cloudinary upload validation rejects wrong format, oversize, bad dimensions/aspect ratio, missing rights confirmation, and missing alt text with understandable errors.
- Removing a media reference does not delete its asset; deletion is blocked while referenced and succeeds only for an unused asset after confirmation.
- SEO output contains the expected unique title, description, H1, canonical, social image, breadcrumbs, structured data, and published-only sitemap entry.
- Draft, preview, archived, and redirect-only URLs are excluded from indexing signals and sitemap output.
- Analytics events fire with the correct airport identity/slug for page view, quote start, quote completion, and booking handoff.
- The six migrated pages preserve their customer-visible airport facts, terminals, booking prefill, metadata intent, and responsive usability during cutover.
- Keyboard navigation, focus visibility, form labels, image alternatives, heading order, and basic colour contrast work on the admin editor and public template.

The secondary seam is direct testing of deterministic business rules. Keep these rules independent from UI and network access, and run them through the same Playwright test runner:

- Slug normalization, required `-airport-taxi` suffix, valid-character rules, and edge cases.
- Exact duplicate detection for slug, SEO title, and IATA code.
- Redirect-chain collapse and redirect-loop rejection.
- Publish Blocker classification for every required field and relationship.
- Publish Warning classification for similar descriptions, repeated prose, and reused hero images.
- Required-section visibility/removal rules.
- Minimum page-specific FAQ and related-destination counts.
- Featured-page maximum.
- Media format, size, dimensions, aspect ratio, alt text, and rights rules.
- Published-only sitemap eligibility and lifecycle/booking-availability combinations.

Use isolated test records and clean them through scoped test utilities. Do not point destructive test cleanup at development or production data. Replace Google Places, Cloudinary delivery/upload, maps, analytics transport, and deliberately failed network responses at their external boundaries while keeping the application database and application routes real in the main end-to-end flow. A small smoke run should cover the critical create-to-publish journey on every change; the full suite should cover the broader lifecycle and fallback matrix.

## Out of Scope

- A free-form drag-and-drop page builder.
- Custom HTML, JavaScript, CSS, colours, fonts, or arbitrary embeds in content.
- City/Town Page creation, editing, rendering, or migration in this release.
- Bulk import from Excel or any other spreadsheet.
- Automatic AI-written airport content or copied competitor wording.
- Automatic publication without human review.
- Multiple admin users, roles, permissions, approval chains, or editorial assignments.
- Scheduled publishing or expiry.
- More than one retained previous Published Snapshot or a complete revision-history interface.
- Hard deletion of any formerly published page.
- A Duplicate Page action.
- Dedicated airport-to-airport Destination Pages.
- A full reviews ingestion/moderation platform.
- Self-authored star ratings or review structured data.
- Advanced digital-asset-management features such as folders, bulk operations, automated rights expiry, or image editing.
- An always-loaded interactive map.
- A new pricing engine, new fleet-management system, or per-page vehicle price overrides.
- A new booking flow.
- Multi-language content or translation workflows.
- A custom analytics dashboard; events are sent to the existing Vercel Analytics setup.
- Exact enforcement of a 1,200–2,000 word target.
- Automatic creation of all airports from the workbook.

## Further Notes

- The approved architectural decisions are recorded in `CONTEXT.md` and ADRs 0001–0004. If implementation discovers a genuine conflict, update the relevant ADR before changing the product contract silently.
- The initial canonical slug examples are `heathrow-airport-taxi`, `gatwick-airport-taxi`, `stansted-airport-taxi`, `luton-airport-taxi`, `london-city-airport-taxi`, `southend-airport-taxi`, and `aberdeen-airport-taxi`.
- Sheet 6 of the supplied workbook is the content-opportunity source, not a machine-import contract. Its categories can inform later City/Town discovery work, but only airports are in this release.
- Airport facts, transfer claims, policies, and route descriptions must be checked by the administrator. The builder should make sources and review visible internally, but it cannot guarantee factual accuracy on the administrator's behalf.
- Cloudinary account values are deployment configuration. The cloud name may be public; the API secret must remain server-only. Configuration errors should fail safely and clearly in the admin upload flow.
- Public content must not be copied from altCABS. Use the reference to understand depth and topic coverage, then write original ONE Airport Taxi content.
- This specification is ready to decompose into ordered implementation tickets.
