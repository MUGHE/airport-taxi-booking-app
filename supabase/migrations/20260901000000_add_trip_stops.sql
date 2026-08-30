alter table public.bookings
  add column if not exists stops jsonb not null default '[]'::jsonb,
  add column if not exists stops_total numeric(10, 2) not null default 0 check (stops_total >= 0);
create table if not exists public.stop_pricing (
  id boolean primary key default true check (id),
  price_per_stop numeric(10, 2) not null default 5 check (price_per_stop >= 0),
  updated_at timestamptz not null default now()
);
alter table public.stop_pricing enable row level security;
insert into public.stop_pricing (id, price_per_stop) values (true, 5)
on conflict (id) do nothing;
