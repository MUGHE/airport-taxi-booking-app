-- Fleet lineup update: adds the two new vehicle classes introduced alongside the
-- refreshed vehicle images/descriptions, and retires the old "luxury_mpv" (Executive MPV)
-- class, which isn't part of the new lineup.
insert into public.vehicle_pricing (vehicle_id, min_fare, per_mile_after, per_minute_rate) values
  ('mpv_4seater', 62, 2.5, 0.5), ('minibus_8seater', 95, 2.8, 0.5)
on conflict (vehicle_id) do nothing;

delete from public.vehicle_pricing where vehicle_id = 'luxury_mpv';
