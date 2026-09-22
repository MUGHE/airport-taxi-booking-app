alter table public.bookings
  add column if not exists source_place_id text,
  add column if not exists source_place_slug text;

create index if not exists bookings_source_place_id_idx on public.bookings (source_place_id);
