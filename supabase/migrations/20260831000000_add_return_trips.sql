alter table public.bookings
  add column if not exists outbound_trip_reference text references public.bookings(reference),
  add column if not exists return_trip_reference text references public.bookings(reference);
create table if not exists public.return_trip_discount (
  id boolean primary key default true check (id),
  active boolean not null default false,
  discount_percent numeric(5, 2) not null default 10 check (discount_percent >= 0 and discount_percent <= 100),
  updated_at timestamptz not null default now()
);
alter table public.return_trip_discount enable row level security;
insert into public.return_trip_discount (id, active, discount_percent) values (true, false, 10)
on conflict (id) do nothing;
