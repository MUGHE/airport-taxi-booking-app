-- Referral programme: every verified customer gets a code; bookings made through a
-- referral link are attributed to the referrer, who earns a commission (a share of the
-- final fare) once the ride is marked completed. Payouts are made outside the app and
-- recorded here by an admin.
alter table public.customers add column if not exists referral_code text unique;

alter table public.bookings add column if not exists referrer_customer_id uuid references public.customers(id) on delete set null;
create index if not exists bookings_referrer_customer_id_idx on public.bookings (referrer_customer_id);

create table if not exists public.referral_settings (
  id boolean primary key default true check (id),
  active boolean not null default false,
  commission_percent numeric(5, 2) not null default 5 check (commission_percent >= 0 and commission_percent <= 100),
  updated_at timestamptz not null default now()
);
insert into public.referral_settings (id, active, commission_percent) values (true, false, 5)
on conflict (id) do nothing;

-- One commission per booking, so re-marking a ride "completed" can never pay twice.
create table if not exists public.referral_commissions (
  booking_reference text primary key references public.bookings(reference) on delete cascade,
  referrer_customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists referral_commissions_referrer_idx on public.referral_commissions (referrer_customer_id);

alter table public.referral_settings enable row level security;
alter table public.referral_commissions enable row level security;
