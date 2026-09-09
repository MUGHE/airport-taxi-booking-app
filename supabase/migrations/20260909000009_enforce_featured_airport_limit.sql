create or replace function public.enforce_featured_airport_limit()
returns trigger
language plpgsql
as $$
begin
  if new.page_type = 'airport' and new.lifecycle_state = 'published' and new.featured then
    if exists (
      select 1
      from public.destination_pages
      where page_type = 'airport'
        and lifecycle_state = 'published'
        and featured
        and id <> new.id
      offset 6
    ) then
      raise exception 'No more than six Featured Airports can be selected';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_featured_airport_limit on public.destination_pages;
create constraint trigger enforce_featured_airport_limit
after insert or update of featured, lifecycle_state, page_type on public.destination_pages
deferrable initially deferred
for each row execute function public.enforce_featured_airport_limit();
