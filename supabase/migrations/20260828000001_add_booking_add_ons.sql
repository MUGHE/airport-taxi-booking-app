create table if not exists public.booking_add_ons (
  id text primary key,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true
);
alter table public.bookings
  add column if not exists add_ons jsonb not null default '[]'::jsonb,
  add column if not exists add_ons_total numeric(10, 2) not null default 0 check (add_ons_total >= 0);
alter table public.booking_add_ons enable row level security;
insert into public.booking_add_ons (id, name, price) values
  ('child-seat', 'Child seat', 12),
  ('booster-seat', 'Booster seat', 8),
  ('meet-greet', 'Meet & greet', 15)
on conflict (id) do nothing;
