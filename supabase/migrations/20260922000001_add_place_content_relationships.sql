alter table public.destination_page_relationships
  add column if not exists relationship_kind text not null default 'related_route',
  add column if not exists place_display_order integer not null default 0;

alter table public.destination_page_relationships
  drop constraint if exists destination_page_relationships_relationship_kind_check,
  add constraint destination_page_relationships_relationship_kind_check
    check (relationship_kind in ('related_route', 'supported_airport', 'nearby_place')),
  drop constraint if exists destination_page_relationships_place_display_order_check,
  add constraint destination_page_relationships_place_display_order_check check (place_display_order >= 0);

create or replace function public.validate_destination_page_relationship()
returns trigger language plpgsql set search_path = public as $$
declare a_type text; b_type text; a_state text; b_state text;
begin
  select page_type, lifecycle_state into a_type, a_state from destination_pages where id = new.page_a_id;
  select page_type, lifecycle_state into b_type, b_state from destination_pages where id = new.page_b_id;
  if new.relationship_kind = 'related_route' and (a_type <> 'airport' or b_type <> 'airport') then
    raise exception 'Related Routes require two Airport Pages';
  elsif new.relationship_kind = 'supported_airport' and not ((a_type = 'place' and b_type = 'airport') or (a_type = 'airport' and b_type = 'place')) then
    raise exception 'Supported Airports require exactly one Place Page and one Airport Page';
  elsif new.relationship_kind = 'nearby_place' and (a_type <> 'place' or b_type <> 'place') then
    raise exception 'Nearby Places require two Place Pages';
  end if;
  if new.relationship_kind = 'supported_airport'
    and ((a_type = 'airport' and a_state <> 'published') or (b_type = 'airport' and b_state <> 'published')) then
    raise exception 'Supported Airports require a Published Airport Page';
  elsif new.relationship_kind = 'nearby_place' and a_state <> 'published' and b_state <> 'published' then
    raise exception 'Nearby Places require at least one Published Place Page';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_destination_page_relationship on public.destination_page_relationships;
create trigger validate_destination_page_relationship before insert or update on public.destination_page_relationships
for each row execute function public.validate_destination_page_relationship();

create index if not exists destination_page_relationships_kind_order_idx
  on public.destination_page_relationships (relationship_kind, place_display_order);
