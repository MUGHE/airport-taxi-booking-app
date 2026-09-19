-- Admin-managed congestion zone (a [lat, lng] polygon) and the flat fee charged when a
-- trip's pickup, drop-off, or any stop falls inside it. Single-row table like stop_pricing.
create table if not exists public.congestion_pricing (
  id boolean primary key default true check (id),
  fee numeric(10, 2) not null default 18 check (fee >= 0),
  zone jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.congestion_pricing enable row level security;
-- Seeded with the TfL Congestion Charge zone, traced around the Inner Ring Road.
insert into public.congestion_pricing (id, fee, zone) values (true, 18, '[
  [51.5226, -0.1633], [51.5300, -0.1230], [51.5323, -0.1058], [51.5257, -0.0876],
  [51.5165, -0.0730], [51.5079, -0.0754], [51.5031, -0.0754], [51.4948, -0.1006],
  [51.4861, -0.1229], [51.4965, -0.1447], [51.5027, -0.1527], [51.5131, -0.1590]
]'::jsonb)
on conflict (id) do nothing;
