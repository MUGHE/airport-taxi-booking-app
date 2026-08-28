create table if not exists public.promo_codes (
  code text primary key,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint promo_codes_percent_range check (discount_type <> 'percent' or discount_value <= 100)
);
alter table public.bookings
  add column if not exists promo_code text,
  add column if not exists discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);
alter table public.promo_codes enable row level security;
