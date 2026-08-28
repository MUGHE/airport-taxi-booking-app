-- Singleton settings row: `id` is constrained to the literal value `true`,
-- so Postgres's primary key uniqueness guarantees at most one row can ever exist.
create table if not exists public.site_promotion (
  id boolean primary key default true,
  active boolean not null default false,
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  updated_at timestamptz not null default now(),
  constraint site_promotion_singleton check (id)
);
insert into public.site_promotion (id, active, discount_percent) values (true, false, 0)
on conflict (id) do nothing;
alter table public.site_promotion enable row level security;
