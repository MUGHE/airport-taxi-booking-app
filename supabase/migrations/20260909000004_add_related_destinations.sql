create table if not exists public.destination_page_relationships (
  id uuid primary key default gen_random_uuid(),
  page_a_id uuid not null references public.destination_pages(id) on delete cascade,
  page_b_id uuid not null references public.destination_pages(id) on delete cascade,
  a_heading text not null,
  a_description text not null,
  a_image jsonb,
  b_heading text not null,
  b_description text not null,
  b_image jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (page_a_id < page_b_id),
  check (page_a_id <> page_b_id),
  unique (page_a_id, page_b_id),
  check (a_image is null or jsonb_typeof(a_image) = 'object'),
  check (b_image is null or jsonb_typeof(b_image) = 'object')
);

create index if not exists destination_page_relationships_b_idx
  on public.destination_page_relationships (page_b_id);
