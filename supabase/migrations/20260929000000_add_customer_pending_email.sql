-- A signed-in customer changing their email: the new address is held here until they enter
-- the code sent to it (reusing the otp_* columns), so a typo can never lock them out.
alter table public.customers add column if not exists pending_email text check (pending_email = lower(pending_email));
