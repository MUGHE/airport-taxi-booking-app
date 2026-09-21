-- `city_town` was never used in production. Prove that before removing the
-- legacy value, so an unexpected record cannot be silently reclassified.
do $$
begin
  if exists (select 1 from public.destination_pages where page_type = 'city_town') then
    raise exception 'Cannot replace legacy city_town page type: destination_pages still contains city_town records';
  end if;
end;
$$;

alter table public.destination_pages
  drop constraint if exists destination_pages_page_type_check;

alter table public.destination_pages
  add constraint destination_pages_page_type_check
  check (page_type in ('airport', 'place'));
