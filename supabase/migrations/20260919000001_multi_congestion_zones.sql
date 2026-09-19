-- Generalizes congestion_pricing (one zone, one non-negative fee) into congestion_zones: any
-- number of named zones, each with a signed fee (negative = discount, e.g. an office zone;
-- positive = surcharge). A trip is charged the sum of every zone it touches. Named like
-- promo_codes (name is the primary key) since admins add/remove zones the same way.
create table if not exists public.congestion_zones (
  name text primary key,
  fee numeric(10, 2) not null,
  zone jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.congestion_zones enable row level security;

insert into public.congestion_zones (name, fee, zone, updated_at)
select 'Congestion Charge Zone', fee, zone, updated_at from public.congestion_pricing
on conflict (name) do nothing;

drop table if exists public.congestion_pricing;
