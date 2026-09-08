# 02: Render the first Airport Page from Supabase

**What to build:** Make one existing airport work end to end from a Supabase Published Snapshot, including its identity, terminal, structured content, metadata, and booking prefill, while keeping the other airport pages safely on their current source.

**Blocked by:** 01: Create the shared Airport Page renderer and test foundation.

**Status:** resolved

- [ ] The database can represent a stable Destination Page identity, Airport Page type, lifecycle state, booking availability, current Draft, current Published Snapshot, one recovery snapshot, and content schema version.
- [ ] Airport identity includes official name, display name, unique IATA code, service area, Google place identity, address, coordinates, ordered terminals, and exactly one primary terminal.
- [ ] The first seeded airport resolves by its published slug and renders through the shared production renderer.
- [ ] The page uses only its Published Snapshot for public prose and section content.
- [ ] The quote form is prefilled from the same published airport and primary-terminal data shown on the page.
- [ ] Draft-only data cannot be read through the public airport URL.
- [ ] Database constraints protect exact slug and IATA uniqueness and invalid terminal-primary combinations.
- [ ] A browser test proves the database-backed page, metadata intent, terminal display, and booking prefill while another existing page continues to work.

## Answer

Added the Supabase destination-page schema and seeded Heathrow Published Snapshot, including Draft and Recovery slots, airport identity, ordered terminals, and primary-terminal constraints. Public routes now query only published Airport Pages and their Published Snapshot, while safely falling back to the existing source for other airports or database failures. Added an opt-in browser check for the seeded page and preserved the existing six-page responsive checks.
