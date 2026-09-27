-- "Continue with Google": the Google account's stable id (OIDC `sub`). Customers who only
-- ever used Google have password_hash = '' (no password) until they set one in Settings.
alter table public.customers add column if not exists google_sub text unique;
