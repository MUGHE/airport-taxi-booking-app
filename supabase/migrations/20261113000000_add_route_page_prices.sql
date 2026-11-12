-- Route pages: prices are typed in by admins (one row per quote) instead of being calculated.
-- Each item: { "vehicleId": "<vehicle id or empty>", "label": "Saloon", "price": 120, "note": "" }.

alter table public.route_pages
  add column if not exists prices jsonb not null default '[]'::jsonb;

alter table public.route_pages drop constraint if exists route_pages_prices_is_array;
alter table public.route_pages
  add constraint route_pages_prices_is_array check (jsonb_typeof(prices) = 'array');
