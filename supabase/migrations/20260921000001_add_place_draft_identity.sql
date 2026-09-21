alter table public.destination_pages
  add column if not exists place_type text,
  add column if not exists place_group_id uuid,
  add column if not exists primary_parent_id uuid references public.destination_pages(id) on delete restrict;

create table if not exists public.destination_place_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (normalized_name)
);

insert into public.destination_place_groups (name, normalized_name, display_order, active)
values ('London and nearby places', 'london and nearby places', 0, true)
on conflict (normalized_name) do nothing;

alter table public.destination_pages
  drop constraint if exists destination_pages_place_group_id_fkey,
  add constraint destination_pages_place_group_id_fkey foreign key (place_group_id) references public.destination_place_groups(id) on delete restrict,
  add constraint destination_pages_place_identity_check check (
    (page_type = 'airport' and place_type is null and place_group_id is null and primary_parent_id is null)
    or (page_type = 'place' and iata_code is null and service_area is null and place_type is not null and place_group_id is not null)
  );

create table if not exists public.destination_place_aliases (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.destination_pages(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  display_order integer not null default 0 check (display_order >= 0),
  unique (page_id, normalized_name)
);

create table if not exists public.destination_covered_localities (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.destination_pages(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  locality_type text not null,
  display_order integer not null default 0 check (display_order >= 0),
  notes text,
  unique (page_id, normalized_name)
);

create or replace function public.normalized_place_identity(value text)
returns text language sql immutable strict as $$
  select lower(regexp_replace(trim(value), '\s+', ' ', 'g'))
$$;

create or replace function public.validate_place_identity()
returns trigger language plpgsql as $$
declare
  conflict_name text;
  cursor_id uuid;
begin
  if new.page_type <> 'place' then return new; end if;

  if new.lifecycle_state <> 'archived' then
    select candidate.normalized_name into conflict_name
    from (
      select id as owner_id, public.normalized_place_identity(coalesce(display_name, '')) as normalized_name
        from public.destination_pages where page_type = 'place' and lifecycle_state <> 'archived'
      union all
      select id, public.normalized_place_identity(coalesce(official_name, ''))
        from public.destination_pages where page_type = 'place' and lifecycle_state <> 'archived'
      union all
      select aliases.page_id, aliases.normalized_name from public.destination_place_aliases aliases
        join public.destination_pages pages on pages.id = aliases.page_id and pages.lifecycle_state <> 'archived'
      union all
      select localities.page_id, localities.normalized_name from public.destination_covered_localities localities
        join public.destination_pages pages on pages.id = localities.page_id and pages.lifecycle_state <> 'archived'
    ) candidate
    where candidate.owner_id <> new.id
      and candidate.normalized_name <> ''
      and candidate.normalized_name in (
        public.normalized_place_identity(coalesce(new.display_name, '')),
        public.normalized_place_identity(coalesce(new.official_name, ''))
      )
    limit 1;
    if conflict_name is not null then
      raise exception 'Ambiguous active Place identity: %', conflict_name;
    end if;
  end if;

  cursor_id := new.primary_parent_id;
  while cursor_id is not null loop
    if cursor_id = new.id then raise exception 'A Primary Parent relationship cannot form a cycle'; end if;
    select primary_parent_id into cursor_id from public.destination_pages where id = cursor_id and page_type = 'place';
    if not found then raise exception 'Primary Parent must be a Place Page'; end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists validate_place_identity_on_page on public.destination_pages;
create constraint trigger validate_place_identity_on_page
after insert or update on public.destination_pages
deferrable initially deferred for each row execute function public.validate_place_identity();

create or replace function public.validate_place_support_identity()
returns trigger language plpgsql as $$
declare conflict_name text;
begin
  new.name := trim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.normalized_name := public.normalized_place_identity(new.name);
  select term into conflict_name from (
    select public.normalized_place_identity(coalesce(display_name, '')) as term from public.destination_pages where page_type = 'place' and lifecycle_state <> 'archived'
    union all select public.normalized_place_identity(coalesce(official_name, '')) from public.destination_pages where page_type = 'place' and lifecycle_state <> 'archived'
    union all select aliases.normalized_name from public.destination_place_aliases aliases join public.destination_pages pages on pages.id = aliases.page_id and pages.lifecycle_state <> 'archived' where aliases.id <> new.id
    union all select localities.normalized_name from public.destination_covered_localities localities join public.destination_pages pages on pages.id = localities.page_id and pages.lifecycle_state <> 'archived' where localities.id <> new.id
  ) identities where term = new.normalized_name limit 1;
  if conflict_name is not null then raise exception 'Ambiguous active Place identity: %', conflict_name; end if;
  return new;
end;
$$;

drop trigger if exists validate_place_alias_identity on public.destination_place_aliases;
create trigger validate_place_alias_identity before insert or update on public.destination_place_aliases
for each row execute function public.validate_place_support_identity();
drop trigger if exists validate_covered_locality_identity on public.destination_covered_localities;
create trigger validate_covered_locality_identity before insert or update on public.destination_covered_localities
for each row execute function public.validate_place_support_identity();

create index if not exists destination_pages_place_group_idx on public.destination_pages(place_group_id) where page_type = 'place';
create index if not exists destination_pages_primary_parent_idx on public.destination_pages(primary_parent_id) where page_type = 'place';
create index if not exists destination_place_aliases_search_idx on public.destination_place_aliases(normalized_name);
create index if not exists destination_covered_localities_search_idx on public.destination_covered_localities(normalized_name);

create or replace function public.replace_destination_place_support(p_page_id uuid, p_aliases jsonb, p_localities jsonb)
returns void language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from destination_pages where id = p_page_id and page_type = 'place') then
    raise exception 'Place Page not found';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p_aliases, '[]'::jsonb)) item where nullif(trim(item->>'name'), '') is null)
    or exists (select 1 from jsonb_array_elements(coalesce(p_localities, '[]'::jsonb)) item where nullif(trim(item->>'name'), '') is null or nullif(trim(item->>'localityType'), '') is null) then
    raise exception 'Place support names and locality types cannot be empty';
  end if;
  delete from destination_place_aliases where page_id = p_page_id;
  insert into destination_place_aliases (page_id, name, normalized_name, display_order)
  select p_page_id, value->>'name', normalized_place_identity(value->>'name'), ordinality - 1
  from jsonb_array_elements(coalesce(p_aliases, '[]'::jsonb)) with ordinality;
  delete from destination_covered_localities where page_id = p_page_id;
  insert into destination_covered_localities (page_id, name, normalized_name, locality_type, display_order, notes)
  select p_page_id, value->>'name', normalized_place_identity(value->>'name'), value->>'localityType', ordinality - 1, nullif(value->>'notes', '')
  from jsonb_array_elements(coalesce(p_localities, '[]'::jsonb)) with ordinality;
end;
$$;
revoke all on function public.replace_destination_place_support(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.replace_destination_place_support(uuid, jsonb, jsonb) to service_role;

alter table public.destination_place_groups enable row level security;
alter table public.destination_place_aliases enable row level security;
alter table public.destination_covered_localities enable row level security;
