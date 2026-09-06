-- Run this migration in the Supabase SQL Editor for existing deployments.
-- Linear deadhead compensation: past a per-vehicle long-distance threshold the driver is
-- very likely returning empty, so those miles carry an extra per-mile rate *on top of*
-- per_mile_after. Both values are admin-editable per vehicle class.
--
-- deadhead_per_mile defaults to 0 so applying this migration alone changes no fares —
-- the rate is switched on from the admin Vehicle pricing panel.
alter table public.vehicle_pricing
  add column if not exists long_distance_threshold_miles numeric(10, 2) not null default 50
  check (long_distance_threshold_miles >= 0);

alter table public.vehicle_pricing
  add column if not exists deadhead_per_mile numeric(10, 2) not null default 0
  check (deadhead_per_mile >= 0);
