-- `city_town` was never used. Stop immediately if that assumption is false so
-- no legacy record is silently reclassified as a Place Page.
do $$
begin
  if exists (select 1 from public.destination_pages where page_type = 'city_town') then
    raise exception 'Cannot replace city_town: existing Destination Page records must be migrated deliberately';
  end if;
end;
$$;

alter table public.destination_pages
  drop constraint if exists destination_pages_page_type_check;

alter table public.destination_pages
  add constraint destination_pages_page_type_check
  check (page_type in ('airport', 'place'));

-- The original slug check was Airport-specific. Keep that rule for Airport
-- Pages, while allowing a short Place Slug and no IATA code for Place Pages.
alter table public.destination_pages
  drop constraint if exists destination_pages_slug_check,
  add constraint destination_pages_page_type_identity_check check (
    (page_type = 'airport' and (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-airport-taxi$'))
    or (page_type = 'place' and (slug is null or (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug !~ '-airport-taxi$')) and iata_code is null)
  );
