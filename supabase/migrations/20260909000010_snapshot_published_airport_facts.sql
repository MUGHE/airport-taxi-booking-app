-- Keep search-visible airport facts tied to the Published Snapshot. Saving a
-- Draft may update the editable page record, but these values change only when
-- a Published Snapshot is inserted or replaced by the atomic publish function.
create or replace function public.snapshot_published_airport_facts()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  page_record public.destination_pages%rowtype;
begin
  if new.snapshot_kind <> 'published' then
    return new;
  end if;

  select * into page_record
  from public.destination_pages
  where id = new.page_id;

  if not found then
    raise exception 'Published Snapshot page not found';
  end if;

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

drop trigger if exists snapshot_published_airport_facts on public.destination_page_snapshots;

-- Historical identity was not stored for custom pages before this migration.
-- Stop safely instead of guessing when a newer Draft may contain unpublished
-- identity edits. The migration transaction rolls back and names the page that
-- an operator must reconcile before retrying.
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
    raise exception 'Cannot safely backfill published airport facts for %: reconcile or publish its newer Draft first', unsafe_slug;
  end if;
end;
$preflight$;

-- The six migration-built pages have an immutable source record, so their
-- existing Published Snapshots can be backfilled even if an editor has since
-- saved a newer Draft. Other pages are backfilled only when the preflight proves
-- that no newer Draft exists. Later cycles are protected by the trigger below.
with legacy_facts(slug, official_name, display_name, iata_code, service_area, google_place_id, address, latitude, longitude) as (
  values
    ('heathrow-airport-taxi', 'London Heathrow Airport', 'Heathrow', 'LHR', 'Hillingdon', 'ChIJ6W3FzULyXEcR', 'London Heathrow Airport, Hounslow, UK', 51.4700::double precision, -0.4543::double precision),
    ('gatwick-airport-taxi', 'London Gatwick Airport', 'Gatwick', 'LGW', 'Crawley', 'ChIJ8W0U5wqxdUgR', 'London Gatwick Airport, Crawley, UK', 51.1537::double precision, -0.1821::double precision),
    ('stansted-airport-taxi', 'London Stansted Airport', 'Stansted', 'STN', 'Uttlesford', 'ChIJq1Wq8d8c2EcR', 'London Stansted Airport, Stansted, UK', 51.8850::double precision, 0.2350::double precision),
    ('luton-airport-taxi', 'London Luton Airport', 'Luton', 'LTN', 'Luton', 'ChIJb7bYwDgzd0gR', 'London Luton Airport, Luton, UK', 51.8747::double precision, -0.3683::double precision),
    ('london-city-airport-taxi', 'London City Airport', 'London City', 'LCY', 'Newham', 'ChIJt7x7y7QcdkgR', 'London City Airport, London, UK', 51.5053::double precision, 0.0553::double precision),
    ('southend-airport-taxi', 'London Southend Airport', 'Southend', 'SEN', 'Southend-on-Sea', 'ChIJh8Q4w8Wl2EcR', 'London Southend Airport, Southend-on-Sea, UK', 51.5714::double precision, 0.6956::double precision)
)
update public.destination_page_snapshots snapshots
set content = jsonb_set(
  snapshots.content,
  '{publishedFacts}',
  jsonb_build_object(
    'officialName', coalesce(facts.official_name, pages.official_name),
    'displayName', coalesce(facts.display_name, pages.display_name),
    'iataCode', coalesce(facts.iata_code, pages.iata_code),
    'serviceArea', coalesce(facts.service_area, pages.service_area),
    'googlePlaceId', coalesce(facts.google_place_id, pages.google_place_id),
    'address', coalesce(facts.address, pages.address),
    'latitude', coalesce(facts.latitude, pages.latitude),
    'longitude', coalesce(facts.longitude, pages.longitude)
  ),
  true
)
from public.destination_pages pages
left join legacy_facts facts on facts.slug = pages.published_slug
where snapshots.page_id = pages.id
  and snapshots.snapshot_kind = 'published'
  and (
    facts.slug is not null
    or not exists (
      select 1
      from public.destination_page_snapshots draft
      where draft.id = pages.current_draft_snapshot_id
        and draft.created_at > snapshots.created_at
    )
  );

-- Install the trigger after the one-time backfill so it cannot replace the
-- immutable seed values above. From now on it snapshots identity on Publish.
create trigger snapshot_published_airport_facts
before insert or update of content on public.destination_page_snapshots
for each row execute function public.snapshot_published_airport_facts();
