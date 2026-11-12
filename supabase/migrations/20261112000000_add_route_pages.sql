-- Route pages: one public page per pair of places (airport or town), covering both directions,
-- e.g. /heathrow-to-birmingham-taxi also covers Birmingham to Heathrow, and the reverse URL
-- redirects to it. Admins choose which pairs get a page; text left empty is written by the site.
-- Reads and writes go through the server with the service role key, so RLS is on with no policies.

create table if not exists public.route_pages (
  id uuid primary key default gen_random_uuid(),
  endpoint_a_id uuid not null references public.destination_pages (id) on delete restrict,
  endpoint_b_id uuid not null references public.destination_pages (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-to-[a-z0-9]+(-[a-z0-9]+)*-taxi$' and char_length(slug) <= 120),
  reverse_slug text not null unique check (reverse_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-to-[a-z0-9]+(-[a-z0-9]+)*-taxi$' and char_length(reverse_slug) <= 120),
  heading text not null default '' check (char_length(heading) <= 160),
  intro text not null default '' check (char_length(intro) <= 1200),
  a_to_b_text text not null default '' check (char_length(a_to_b_text) <= 1200),
  b_to_a_text text not null default '' check (char_length(b_to_a_text) <= 1200),
  faqs jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  seo_title text not null default '' check (char_length(seo_title) <= 70),
  seo_description text not null default '' check (char_length(seo_description) <= 170),
  distance_miles numeric(7, 1),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint route_pages_distinct_endpoints check (endpoint_a_id <> endpoint_b_id),
  constraint route_pages_slugs_differ check (slug <> reverse_slug),
  constraint route_pages_published_has_date check (status = 'draft' or published_at is not null)
);

-- One page per pair, whichever way round it was entered.
create unique index if not exists route_pages_pair_idx on public.route_pages (least(endpoint_a_id, endpoint_b_id), greatest(endpoint_a_id, endpoint_b_id));
create index if not exists route_pages_status_idx on public.route_pages (status);

-- A route URL must never also be the other way round of a different route.
create or replace function public.check_route_page_slugs() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from public.route_pages where id <> new.id and (slug = new.reverse_slug or reverse_slug = new.slug)) then
    raise exception 'route page slug already used by another route' using errcode = '23505';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists route_pages_check_slugs on public.route_pages;
create trigger route_pages_check_slugs before insert or update on public.route_pages
  for each row execute function public.check_route_page_slugs();

alter table public.route_pages enable row level security;
