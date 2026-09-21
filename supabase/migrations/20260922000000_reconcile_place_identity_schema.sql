-- Reconcile the Place schema that exists in older environments with the
-- current Place draft code. This migration is deliberately additive.

alter table public.destination_pages
  add column if not exists primary_parent_id uuid;

update public.destination_pages
set primary_parent_id = primary_parent_page_id
where primary_parent_id is null
  and primary_parent_page_id is not null;

alter table public.destination_place_aliases
  add column if not exists name text,
  add column if not exists normalized_name text,
  add column if not exists display_order integer not null default 0;

update public.destination_place_aliases
set name = coalesce(name, alias),
    normalized_name = coalesce(normalized_name, lower(regexp_replace(trim(alias), '\s+', ' ', 'g')))
where name is null or normalized_name is null;

alter table public.destination_place_aliases
  alter column name set not null,
  alter column normalized_name set not null;

create unique index if not exists destination_place_aliases_page_id_normalized_name_key
  on public.destination_place_aliases(page_id, normalized_name);
create index if not exists destination_place_aliases_search_idx
  on public.destination_place_aliases(normalized_name);

create or replace function public.sync_place_identity_compatibility()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'destination_place_aliases' then
    new.name := coalesce(nullif(trim(new.name), ''), nullif(trim(new.alias), ''));
    new.alias := coalesce(nullif(trim(new.alias), ''), new.name);
    new.normalized_name := lower(regexp_replace(trim(new.name), '\s+', ' ', 'g'));
  elsif tg_table_name = 'destination_pages' then
    new.primary_parent_id := coalesce(new.primary_parent_id, new.primary_parent_page_id);
    new.primary_parent_page_id := coalesce(new.primary_parent_page_id, new.primary_parent_id);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_place_alias_compatibility on public.destination_place_aliases;
create trigger sync_place_alias_compatibility
before insert or update on public.destination_place_aliases
for each row execute function public.sync_place_identity_compatibility();

drop trigger if exists sync_place_parent_compatibility on public.destination_pages;
create trigger sync_place_parent_compatibility
before insert or update on public.destination_pages
for each row execute function public.sync_place_identity_compatibility();

create or replace function public.replace_destination_place_support(
  p_page_id uuid,
  p_aliases jsonb,
  p_localities jsonb
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from destination_pages
    where id = p_page_id and page_type = 'place'
  ) then
    raise exception 'Place Page not found';
  end if;

  delete from destination_place_aliases where page_id = p_page_id;
  insert into destination_place_aliases (page_id, alias, name, normalized_name, display_order)
  select p_page_id,
         value->>'name',
         value->>'name',
         lower(regexp_replace(trim(value->>'name'), '\s+', ' ', 'g')),
         ordinality - 1
  from jsonb_array_elements(coalesce(p_aliases, '[]'::jsonb)) with ordinality;

  delete from destination_covered_localities where page_id = p_page_id;
  insert into destination_covered_localities
    (page_id, name, normalized_name, locality_type, display_order, notes)
  select p_page_id,
         value->>'name',
         lower(regexp_replace(trim(value->>'name'), '\s+', ' ', 'g')),
         value->>'localityType',
         ordinality - 1,
         nullif(value->>'notes', '')
  from jsonb_array_elements(coalesce(p_localities, '[]'::jsonb)) with ordinality;
end;
$$;

revoke all on function public.replace_destination_place_support(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_destination_place_support(uuid, jsonb, jsonb)
  to service_role;
