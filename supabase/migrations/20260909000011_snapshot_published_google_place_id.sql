-- Preserve the stable Google Place ID with the published airport facts so the
-- public map follows Publish rather than later Draft edits.
drop trigger if exists snapshot_published_airport_facts on public.destination_page_snapshots;

do $preflight$
declare
  unsafe_slug text;
begin
  select pages.published_slug into unsafe_slug
  from public.destination_pages pages
  join public.destination_page_snapshots published on published.id = pages.current_published_snapshot_id
  join public.destination_page_snapshots draft on draft.id = pages.current_draft_snapshot_id
  where pages.lifecycle_state = 'published'
    and pages.published_slug not in (
      'heathrow-airport-taxi', 'gatwick-airport-taxi', 'stansted-airport-taxi',
      'luton-airport-taxi', 'london-city-airport-taxi', 'southend-airport-taxi'
    )
    and draft.created_at > published.created_at
  limit 1;

  if unsafe_slug is not null then
    raise exception 'Cannot safely backfill the published Google Place ID for %: reconcile or publish its newer Draft first', unsafe_slug;
  end if;
end;
$preflight$;

with legacy_places(slug, google_place_id) as (
  values
    ('heathrow-airport-taxi', 'ChIJ6W3FzULyXEcR'),
    ('gatwick-airport-taxi', 'ChIJ8W0U5wqxdUgR'),
    ('stansted-airport-taxi', 'ChIJq1Wq8d8c2EcR'),
    ('luton-airport-taxi', 'ChIJb7bYwDgzd0gR'),
    ('london-city-airport-taxi', 'ChIJt7x7y7QcdkgR'),
    ('southend-airport-taxi', 'ChIJh8Q4w8Wl2EcR')
)
update public.destination_page_snapshots snapshots
set content = jsonb_set(
  snapshots.content,
  '{publishedFacts,googlePlaceId}',
  to_jsonb(coalesce(places.google_place_id, pages.google_place_id)),
  true
)
from public.destination_pages pages
left join legacy_places places on places.slug = pages.published_slug
where snapshots.page_id = pages.id
  and snapshots.snapshot_kind = 'published'
  and (
    places.slug is not null
    or not exists (
      select 1 from public.destination_page_snapshots draft
      where draft.id = pages.current_draft_snapshot_id
        and draft.created_at > snapshots.created_at
    )
  );

create or replace function public.snapshot_published_airport_facts()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  page_record public.destination_pages%rowtype;
begin
  if new.snapshot_kind <> 'published' then return new; end if;

  select * into page_record from public.destination_pages where id = new.page_id;
  if not found then raise exception 'Published Snapshot page not found'; end if;

  new.content := jsonb_set(
    new.content,
    '{publishedFacts}',
    jsonb_build_object(
      'officialName', page_record.official_name,
      'displayName', page_record.display_name,
      'iataCode', page_record.iata_code,
      'serviceArea', page_record.service_area,
      'googlePlaceId', page_record.google_place_id,
      'address', page_record.address,
      'latitude', page_record.latitude,
      'longitude', page_record.longitude
    ),
    true
  );
  return new;
end;
$$;

create trigger snapshot_published_airport_facts
before insert or update of content on public.destination_page_snapshots
for each row execute function public.snapshot_published_airport_facts();
