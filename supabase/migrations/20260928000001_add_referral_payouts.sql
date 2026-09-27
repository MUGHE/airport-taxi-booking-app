-- A payout settles a set of a referrer's owed commissions and must carry the bank-transfer
-- receipt, which the admin uploads and the referrer can view from their account page.
create table if not exists public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  referrer_customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  receipt_path text not null,
  paid_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists referral_payouts_referrer_idx on public.referral_payouts (referrer_customer_id);
alter table public.referral_payouts enable row level security;

alter table public.referral_commissions add column if not exists payout_id uuid references public.referral_payouts(id) on delete restrict;

-- Private bucket: receipts are only ever served through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('referral-receipts', 'referral-receipts', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Records the payout and marks exactly those commissions paid in one transaction, so a
-- payout can never exist without its commissions (or the reverse). Only commissions still
-- pending are settled; the amount is summed here, never trusted from the caller.
create or replace function public.record_referral_payout(p_referrer uuid, p_references text[], p_receipt_path text, p_paid_by uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_amount numeric(10, 2);
  v_payout uuid;
begin
  perform 1 from referral_commissions
    where referrer_customer_id = p_referrer and status = 'pending' and booking_reference = any(p_references)
    for update;
  select coalesce(sum(amount), 0) into v_amount from referral_commissions
    where referrer_customer_id = p_referrer and status = 'pending' and booking_reference = any(p_references);
  if v_amount <= 0 then
    raise exception 'Nothing is owed for these rides any more.';
  end if;

  insert into referral_payouts (referrer_customer_id, amount, receipt_path, paid_by)
    values (p_referrer, v_amount, p_receipt_path, p_paid_by)
    returning id into v_payout;
  update referral_commissions set status = 'paid', paid_at = now(), payout_id = v_payout
    where referrer_customer_id = p_referrer and status = 'pending' and booking_reference = any(p_references);

  return jsonb_build_object('id', v_payout, 'amount', v_amount);
end;
$$;

revoke all on function public.record_referral_payout(uuid, text[], text, uuid) from public, anon, authenticated;
grant execute on function public.record_referral_payout(uuid, text[], text, uuid) to service_role;
