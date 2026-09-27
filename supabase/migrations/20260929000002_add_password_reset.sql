-- Forgot password.
-- otp_purpose: what the outstanding one-time code is for, so a code sent for one flow can
-- never complete another (e.g. a reset code confirming an email change). NULL = sign-up
-- (codes sent before this column existed). 'password_reset_verified' holds the hashed
-- single-use permission to set a new password once the emailed code has been entered.
alter table public.customers add column if not exists otp_purpose text
  check (otp_purpose in ('signup', 'email_change', 'password_reset', 'password_reset_verified'));

-- Sessions that started before this moment are rejected, so resetting or changing a
-- password signs the account out everywhere else.
alter table public.customers add column if not exists password_changed_at timestamptz;
