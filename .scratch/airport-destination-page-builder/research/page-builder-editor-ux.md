# Page-builder editor UX research

Date: 2026-09-10

## Recommendation

Adopt the reference design's focused, tabbed workspace, with one important distinction:
the tabs are a non-linear index for the Admin, not a required step-by-step
wizard. Show one editing area at a time, keep save/publish actions visible, and remove
the permanent preview panel in favour of one **Full Preview** control.

This fits an internal page builder. IBM Carbon says tabs can reduce mental effort by
grouping related forms and settings without taking the user away from their workflow,
but tabs are not a progress indicator for a linear process. [Carbon tabs](https://carbondesignsystem.com/components/tabs/usage/)
GOV.UK similarly says tabs can help frequent caseworking users switch quickly between
related sections, while warning that they hide content and should not be used when
content must be read in order. [GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/)

## Proposed information architecture

Use these tabs in this order:

1. **Basic info** — page title/display name first, then official name, page type, IATA
   code, and service area.
2. **SEO** — slug, SEO title, meta description, H1, canonical URL, and search-result
   preview.
3. **Location** — the main Google airport location plus terminal names, places,
   primary terminal, and ordering.
4. **Hero** — hero heading and hero image.
5. **Content** — the ordered middle page sections and the fixed final booking CTA.
6. **FAQ & trust** — airport FAQs, shared FAQs, service facts, and verified reviews.
7. **Related** — Related Routes and their images.
8. **Publish** — validation summary, booking/featured settings, preview, and publish.

This order starts with the page identity that later fields depend on, then moves through
the public page from global metadata to visible content. GOV.UK recommends splitting
long forms into logical groups, designing the common path first, and allowing internal
expert users to move quickly between tasks. [GOV.UK form structure](https://www.gov.uk/service-manual/design/form-structure)
W3C also recommends splitting long forms by logical groups to make them less daunting
and easier to understand. [W3C multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/)

The labels must remain short. On narrow screens, let the tab row scroll horizontally;
do not wrap it onto multiple lines. Carbon recommends one- or two-word tab labels and
horizontal scrolling rather than wrapping. [Carbon tabs](https://carbondesignsystem.com/components/tabs/usage/)

## Content-tab design

Do not render every rich-text Content Section open inside one large `Structured page content`
card. Replace that with a small Content Section list:

- Show the page order as a flat list: section name, required/optional, visible/hidden,
  and any error state.
- Keep the existing up/down and show/hide actions on each row.
- Selecting a row opens only that block's editor, beside the list on desktop and below
  it on small screens.
- Keep Hero outside this list because it has its own tab. Keep the final booking CTA as
  a fixed last row so the public page order is obvious.
- Preserve edits when the editor switches Content Sections or tabs.

This removes most of the vertical scrolling without nesting more disclosure controls.
GOV.UK warns against nested accordions and says accordions should not be used to split
up a series of form questions. [GOV.UK accordion](https://design-system.service.gov.uk/components/accordion/)
Use a small disclosure only for genuinely optional help or advanced fields; do not hide
fields most editors need. [GOV.UK details](https://design-system.service.gov.uk/components/details/)

## Header, saving, preview, and publishing

Use a sticky editor header containing:

- page name and Draft/Published status
- a quiet state such as `Unsaved changes`, `Saving…`, `Saved 10:42`
- **Full Preview** as a secondary outlined control
- **Save draft** as a secondary action
- **Publish** as the single primary action

Saving and publishing must remain separate: saving protects work; publishing changes
what customers see. Microsoft's Power Apps documentation makes this same distinction
and says autosave prevents work being lost if the browser or device closes.
[Power Apps save and publish](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/save-publish-app)

For this redesign, keep the current explicit draft save and unsaved-change warning.
Autosave can be a follow-up enhancement after the first draft save, provided the UI
shows `Saving…`, `Saved`, and a clear failure state. Do not silently auto-publish.

Remove the current preview card completely. **Full Preview** should open the existing
full-width private preview route in a new tab. If it navigates directly, keep native
link behaviour while styling it as a button. If it first saves dirty changes and then
opens the preview, implement it as an action button and show saving progress. W3C
distinguishes links, which navigate to a resource, from buttons, which trigger an
action. [W3C link pattern](https://www.w3.org/WAI/ARIA/apg/patterns/link/)
[W3C button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

Move archive, delete, and restore into a clearly labelled secondary or overflow actions
area. They should not compete visually with Save draft and Publish.

## Completion and validation

Do not copy the reference's `1 of 8 completed` as a stepper unless each tab has a real,
testable definition of completion. USWDS says a step indicator is for a linear sequence
across several screens and is not navigation itself. [USWDS step indicator](https://designsystem.digital.gov/components/step-indicator/)

For this non-linear editor, a better pattern is a small status on each tab:
`Complete`, `Needs attention`, or an error count. A final Publish tab should list the
remaining blocking errors and warnings, with links back to the relevant tab. GOV.UK's
task-list guidance supports status labels for long work completed in a user-chosen
order. [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)
On failed validation, retain all entered values, show a summary, and focus it; also show
the error beside the field. [GOV.UK validation](https://design-system.service.gov.uk/patterns/validation/)

## Accessibility requirements

- Implement real tab semantics: `tablist`, `tab`, `tabpanel`, `aria-selected`, and
  `aria-controls`.
- Support Left/Right Arrow navigation; support Enter/Space when activation is manual.
- Give every panel a visible heading matching its tab.
- Indicate current, completed, dirty, and error states with text or icons plus accessible
  names, not colour alone.
- Keep keyboard focus and screen-reader reading order logical.

These behaviours follow the W3C tabs pattern. [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
The repository already has a shared tabs component based on Base UI, so implementation
should reuse it rather than create another tab system.

## Acceptance direction

The redesign should be considered successful when an editor can:

1. Reach any major section without scrolling through unrelated fields.
2. See where they are and which sections need attention.
3. Edit one Content Section without loading a wall of open rich-text editors.
4. Switch sections without losing values.
5. Save an incomplete draft safely.
6. Preview from one button without an embedded preview panel.
7. Review all blocking issues before explicitly publishing.

This is a design recommendation based on official guidance and inspection of the
current editor and supplied reference image. It should still be checked with a few real
admin users before treating tab names, grouping, and completion rules as final.
