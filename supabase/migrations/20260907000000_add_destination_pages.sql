-- Structured Airport Pages. Draft and Published Snapshot content are deliberately
-- separate JSON documents so public reads can never accidentally use a draft.
create table if not exists public.destination_pages (
  id uuid primary key default gen_random_uuid(),
  page_type text not null default 'airport' check (page_type in ('airport', 'city_town')),
  lifecycle_state text not null default 'draft' check (lifecycle_state in ('draft', 'published', 'archived')),
  booking_available boolean not null default true,
  slug text not null check (slug = lower(slug) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-airport-taxi$'),
  official_name text not null,
  display_name text not null,
  iata_code text not null check (iata_code = upper(iata_code) and iata_code ~ '^[A-Z]{3}$'),
  service_area text not null,
  google_place_id text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  content_schema_version integer not null default 1 check (content_schema_version > 0),
  current_draft_snapshot_id uuid,
  current_published_snapshot_id uuid,
  recovery_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  unique (iata_code)
);

create table if not exists public.destination_page_snapshots (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.destination_pages(id) on delete cascade,
  snapshot_kind text not null check (snapshot_kind in ('draft', 'published', 'recovery')),
  seo_title text not null,
  meta_description text not null,
  h1 text not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  created_at timestamptz not null default now(),
  unique (page_id, snapshot_kind),
  unique (page_id, id)
);

-- Snapshot pointer ownership and snapshot_kind are checked by the deferred page
-- validation trigger below. Keeping those checks in one trigger avoids ALTER TABLE
-- statements in the same SQL Editor transaction as the seed writes.

create table if not exists public.destination_page_terminals (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.destination_pages(id) on delete cascade,
  display_name text not null,
  address text not null,
  google_place_id text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  sort_order integer not null check (sort_order >= 0),
  is_primary boolean not null default false,
  unique (page_id, sort_order)
);

create unique index if not exists destination_page_one_primary_terminal_idx
  on public.destination_page_terminals (page_id) where is_primary;

create or replace function public.prevent_destination_snapshot_kind_change()
returns trigger
language plpgsql
as $$
begin
  if old.snapshot_kind <> new.snapshot_kind then
    raise exception 'A Published Snapshot kind cannot be changed after creation';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_destination_snapshot_kind_change on public.destination_page_snapshots;
create trigger prevent_destination_snapshot_kind_change
before update on public.destination_page_snapshots
for each row execute function public.prevent_destination_snapshot_kind_change();

create or replace function public.validate_published_airport_page()
returns trigger
language plpgsql
as $$
declare
  page_record public.destination_pages%rowtype;
  v_page_id uuid;
  terminal_count integer;
  primary_count integer;
begin
  if tg_table_name = 'destination_pages' then
    v_page_id := new.id;
  elsif tg_op = 'DELETE' then
    v_page_id := old.page_id;
  else
    v_page_id := new.page_id;
  end if;
  select * into page_record from public.destination_pages where id = v_page_id;
  if page_record.current_draft_snapshot_id is not null and not exists (
    select 1 from public.destination_page_snapshots
    where id = page_record.current_draft_snapshot_id and page_id = page_record.id and snapshot_kind = 'draft'
  ) then
    raise exception 'Current Draft Snapshot must belong to the page and be a draft';
  end if;
  if page_record.current_published_snapshot_id is not null and not exists (
    select 1 from public.destination_page_snapshots
    where id = page_record.current_published_snapshot_id and page_id = page_record.id and snapshot_kind = 'published'
  ) then
    raise exception 'Current Published Snapshot must belong to the page and be published';
  end if;
  if page_record.recovery_snapshot_id is not null and not exists (
    select 1 from public.destination_page_snapshots
    where id = page_record.recovery_snapshot_id and page_id = page_record.id and snapshot_kind = 'recovery'
  ) then
    raise exception 'Recovery Snapshot must belong to the page and be a recovery snapshot';
  end if;
  if page_record.page_type = 'airport' and page_record.lifecycle_state = 'published' then
    select count(*), count(*) filter (where is_primary)
      into terminal_count, primary_count
      from public.destination_page_terminals where page_id = page_record.id;
    if terminal_count = 0 or primary_count <> 1 then
      raise exception 'A published Airport Page must have terminals and exactly one primary terminal';
    end if;
    if page_record.current_published_snapshot_id is null then
      raise exception 'A published Airport Page must have a Published Snapshot';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_published_airport_page_on_page on public.destination_pages;
create constraint trigger validate_published_airport_page_on_page
after insert or update on public.destination_pages
deferrable initially deferred for each row execute function public.validate_published_airport_page();

drop trigger if exists validate_published_airport_page_on_terminal on public.destination_page_terminals;
create constraint trigger validate_published_airport_page_on_terminal
after insert or update or delete on public.destination_page_terminals
deferrable initially deferred for each row execute function public.validate_published_airport_page();

create index if not exists destination_pages_public_slug_idx
  on public.destination_pages (slug) where lifecycle_state = 'published';
