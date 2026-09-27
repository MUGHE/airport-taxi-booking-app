-- Staff accounts for the admin panel (one role each, see lib/admin-roles.ts) and customer
-- accounts for the public site. Passwords are scrypt hashes written by lib/password.ts; the
-- first super admin is created with scripts/create-super-admin.mjs.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text not null default '',
  role text not null check (role in ('super_admin', 'admin', 'dispatcher', 'editor')),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text not null,
  phone text not null default '',
  password_hash text not null,
  -- Sign-up is only complete once the emailed one-time code is entered. The code is
  -- stored hashed, expires, and allows a limited number of guesses.
  email_verified boolean not null default false,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_attempts smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.customers enable row level security;

-- Bookings placed while signed in are linked to the customer, so /account can list them
-- without trusting an (unverified) email match.
alter table public.bookings add column if not exists customer_id uuid references public.customers(id) on delete set null;
create index if not exists bookings_customer_id_idx on public.bookings (customer_id);
