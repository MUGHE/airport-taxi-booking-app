# Place pilot runbook

This runbook is for the first ten Place Pages only. It keeps the historical marketing workbook out of the publishing path.

## Prepare

1. Use `data/place-pilot.csv` in the admin Place importer.
2. If a reliable, aggregated demand report exists, rank only these ten approved names by pickup plus drop-off bookings. The selection helper in `lib/place-pilot.ts` falls back to the documented order when the report is missing or incomplete.
3. Preview the CSV and confirm only valid rows. Import creates Drafts; it does not publish and it does not call Google Places.
4. For each Draft, select and review the matching Google Place, write unique local content, confirm aliases and Covered Localities, select Supported Airports, save, and open Full Preview.

## Publish and verify

Publish each page separately. Resolve blockers first. A warning may be acknowledged only after it has been reviewed.

Check every page at mobile, tablet, and desktop widths. Record one short, non-personal evidence row for each check in the release record:

- exact address booking in both directions and correct airport handoff;
- unavailable airport state;
- directory search by alias and Covered Locality;
- breadcrumbs, old-slug redirect, canonical metadata, sitemap membership, and structured data;
- safe Published Snapshot fallback when the data read fails;
- analytics events and the absence of names, addresses, phone numbers, email, coordinates, notes, or unpublished content;
- keyboard navigation, labels, and visible focus.

The evidence must contain only page slug, device class, check name, pass/fail, timestamp, and a short observation. Do not store customer input or booking references.

Run the database-backed gate after applying migrations and completing the manual checks:

```bash
pnpm run verify:place-pilot
```

Run the deterministic and browser suites before sign-off:

```bash
pnpm run test:rules
pnpm run test:public
pnpm run test:admin
```

The pilot is not approval for wider rollout. Review Place views, quote starts, booking handoffs, completed bookings, and Search Console observations first. Keep the six existing Airport Pages and their workflows unchanged.
