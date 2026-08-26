-- Run this migration in the Supabase SQL Editor for existing deployments.
alter table public.vehicle_pricing
  add column if not exists per_minute_rate numeric(10, 2) not null default 0.5
  check (per_minute_rate >= 0);
