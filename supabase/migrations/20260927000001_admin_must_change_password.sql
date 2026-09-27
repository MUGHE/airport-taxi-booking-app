-- Staff created (or given a new password) by a super admin sign in with a temporary
-- password and must replace it before they can use the dashboard.
alter table public.admin_users add column if not exists must_change_password boolean not null default false;
