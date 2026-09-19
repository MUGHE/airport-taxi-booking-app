-- Post-ride reviews: every rating is kept privately regardless of score; only ratings at or
-- above REVIEW_PUBLISH_THRESHOLD (lib/company.ts) are invited client-side to also post on
-- Google. One review per booking, enforced below.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null references public.bookings(reference) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  customer_name text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists reviews_booking_reference_key on public.reviews (booking_reference);

alter table public.bookings add column if not exists review_requested_at timestamptz;
