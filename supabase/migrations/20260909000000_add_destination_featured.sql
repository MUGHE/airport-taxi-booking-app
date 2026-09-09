alter table public.destination_pages
  add column if not exists featured boolean not null default false;

create index if not exists destination_pages_featured_idx
  on public.destination_pages (featured) where lifecycle_state = 'published';
