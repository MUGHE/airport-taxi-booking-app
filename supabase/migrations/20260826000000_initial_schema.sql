-- Run this in the Supabase SQL Editor or with the Supabase CLI.
-- Server-side code uses the service-role key; browser clients have no table policies.
create table if not exists public.bookings (
  reference text primary key, status text not null check (status in ('pending', 'confirmed', 'assigned', 'completed', 'cancelled')),
  payment_status text not null check (payment_status in ('unpaid', 'paid')), direction text not null check (direction in ('from-airport', 'to-airport')),
  airport_id text not null, destination_address text not null, destination_lat double precision not null, destination_lng double precision not null,
  vehicle_id text not null, pickup_date date not null, pickup_time time not null, flight_number text not null default '',
  passengers integer not null check (passengers > 0), bags integer not null check (bags >= 0), customer_name text not null,
  email text not null, phone text not null, notes text not null default '', fare numeric(10, 2) not null check (fare >= 0),
  distance_miles numeric(10, 2) not null check (distance_miles >= 0), stripe_checkout_session_id text unique,
  stripe_payment_intent_id text, paid_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_pickup_date_idx on public.bookings (pickup_date);
create table if not exists public.vehicle_pricing (
  vehicle_id text primary key, min_fare numeric(10, 2) not null check (min_fare >= 0),
  per_mile_after numeric(10, 2) not null check (per_mile_after >= 0),
  per_minute_rate numeric(10, 2) not null default 0.5 check (per_minute_rate >= 0),
  updated_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
alter table public.vehicle_pricing enable row level security;
insert into public.vehicle_pricing (vehicle_id, min_fare, per_mile_after, per_minute_rate) values
  ('standard', 40, 1.7, 0.5), ('executive', 55, 2.2, 0.5), ('estate', 60, 2.5, 0.5), ('mpv', 65, 2.5, 0.5), ('luxury_mpv', 85, 2.5, 0.5)
on conflict (vehicle_id) do nothing;
