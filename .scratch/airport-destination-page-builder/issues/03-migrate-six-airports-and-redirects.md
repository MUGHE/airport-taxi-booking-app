# 03: Migrate all six existing airports and add legacy redirects

**What to build:** Move Heathrow, Gatwick, Stansted, Luton, London City, and Southend into the destination content model and serve them from Published Snapshots without downtime. Preserve old links through direct permanent redirects to canonical `-airport-taxi` URLs.

**Blocked by:** 02: Render the first Airport Page from Supabase.

**Status:** ready-for-agent

- [x] All six existing airports have stable identities, published content, matching editable drafts, locations, ordered terminals, primary terminals, and canonical SEO-friendly slugs.
- [x] Current customer-visible facts, fleet behaviour, FAQs, CTA actions, and booking prefill are preserved for every migrated airport.
- [x] Current airport imagery is represented through the managed-media contract needed by the published content.
- [x] Each old short slug permanently redirects in one hop to its corresponding `-airport-taxi` canonical slug.
- [x] Redirect resolution rejects loops and does not create multi-hop redirect chains.
- [x] Unknown, draft-only, and archived slugs without a redirect return a genuine not-found response.
- [x] All six canonical pages render from Supabase while the legacy source remains available only as a temporary recovery mechanism.
- [x] Automated coverage verifies the six canonical responses, six legacy redirects, terminal mapping, and absence of fuzzy redirects.

## Comments

Migrated all six airport identities, snapshots, terminals, media records, and legacy redirects in a new Supabase migration. Canonical route links now use the `-airport-taxi` slugs, while the public route checks exact redirects before using the legacy source as a recovery fallback. Added browser coverage for canonical pages and direct legacy redirects, plus updated booking-link rules for canonical identities.
