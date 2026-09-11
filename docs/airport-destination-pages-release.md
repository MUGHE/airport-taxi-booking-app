# Airport Destination Pages release runbook

This runbook is for the database-backed Airport Page cutover. The hardcoded Airport Page content collection is no longer a public fallback. Supabase is the source of truth for page identity, terminals, Published Snapshots, redirects, directory discovery, metadata, and sitemap entries.

## Deployment configuration

Set these values in the deployment environment. Do not commit them, paste them into issue files, or expose server-only values to the browser.

- `NEXT_PUBLIC_SUPABASE_URL`: the Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: the server-only Supabase service-role key.
- `CLOUDINARY_CLOUD_NAME`: the Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: the server-side Cloudinary API key.
- `CLOUDINARY_API_SECRET`: the server-only Cloudinary API secret.
- `CLOUDINARY_UPLOAD_FOLDER`: optional upload folder; defaults to `airport-pages`.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: the browser-restricted Maps and Places key.
- `GOOGLE_MAPS_SERVER_API_KEY`: the server-only Routes API key.

## Migration and cutover

1. Take the normal Supabase backup or confirm the project's recovery point.
2. Apply every file in `supabase/migrations/` in filename order. Do not skip the six-page migration or the Published Snapshot facts migration.
3. Confirm the six canonical pages are `published`, each has a current Published Snapshot, and each Published Snapshot contains the expected airport facts, terminals, hero media, FAQs, and SEO fields.
4. Confirm each legacy slug redirects directly to its canonical slug, and that draft or archived slugs do not redirect unless an explicit redirect record exists.
5. Confirm `/airport-transfers`, the featured header navigation, page metadata, and `/sitemap.xml` contain only published database pages.
6. Deploy the application. The public route must show a service error when Supabase is unavailable and no safe cached Published Snapshot exists; it must never render draft data or the former hardcoded Airport Page collection.
7. Warm each canonical page once, then simulate a Supabase read failure and confirm the last safe Published Snapshot remains visible. Clear the application cache after a publish, restore, slug change, archive, or redirect change if the hosting platform does not restart instances.

## Verification commands

Run these from the repository root:

```bash
pnpm run verify:airport-pages
pnpm exec tsc --noEmit --pretty false
pnpm run test:rules
pnpm run test:admin
pnpm run test:public
pnpm test
```

`verify:airport-pages` must pass before the public browser suite is considered valid. It checks the six migrated canonical pages, current Published Snapshots, airport facts, terminal primaries, and direct legacy redirects.

The public run must cover the `public-desktop`, `public-tablet`, and `public-mobile` projects. Set `RUN_SUPABASE_E2E=1` for the seeded Supabase checks after applying the migrations. Use isolated test records for authenticated create, edit, publish, restore, slug, availability, archive, and media-library checks.

## Manual release checks

- Keyboard through the public template and editor. Confirm visible focus, labels, heading order, useful image alternatives, and readable colour contrast.
- As an unauthenticated visitor, confirm preview, mutations, and upload-signing endpoints are rejected.
- Simulate Supabase, image, map, quote-form, and analytics failures. Confirm the public page stays useful and offers retry, booking, or contact paths.
- Confirm Cloudinary credentials are not present in browser bundles, HTML, logs, or database content.
- Confirm publish, restore, slug change, archive, and availability changes update discovery and redirects as specified.

## Rollback

If a deployment is unsafe, restore the previous application deployment and keep the database unchanged unless the migration itself is faulty. For a content mistake, use the administrator's restore flow to create a new draft from the immediately previous Published Snapshot, review it, and publish it explicitly. Never delete the current Published Snapshot as an emergency shortcut.

The release is complete only after the trusted administrator has reviewed all six migrated pages and is able to add and review future workbook airports one at a time. Bulk import and generated competitor content are not part of this release.
