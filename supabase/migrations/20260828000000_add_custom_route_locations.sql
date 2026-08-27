-- Store the two customer-selected map locations while retaining legacy columns
-- so existing bookings remain readable.
alter table public.bookings
  add column if not exists pickup_address text,
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision,
  add column if not exists dropoff_address text,
  add column if not exists dropoff_lat double precision,
  add column if not exists dropoff_lng double precision;

alter table public.bookings drop constraint if exists bookings_direction_check;
alter table public.bookings
  add constraint bookings_direction_check
  check (direction in ('from-airport', 'to-airport', 'custom'));
