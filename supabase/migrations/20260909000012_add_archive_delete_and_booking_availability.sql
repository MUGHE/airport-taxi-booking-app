-- Safe end-of-life controls for Destination Pages.
alter table public.destination_pages
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text;

alter table public.destination_page_redirects drop constraint if exists destination_page_redirects_target_slug_check;
alter table public.destination_page_redirects add constraint destination_page_redirects_target_slug_check
  check (target_slug = 'airport-transfers' or (target_slug = lower(target_slug) and target_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-airport-taxi$'));

create table if not exists public.destination_page_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.destination_pages(id) on delete set null,
  action text not null check (action in ('delete_draft', 'archive', 'booking_unavailable', 'booking_available')),
  target_slug text,
  admin_identity text not null,
  created_at timestamptz not null default clock_timestamp()
);

create or replace function public.delete_destination_draft(
  p_page_id uuid,
  p_deleted_by text default 'admin'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  page_record public.destination_pages%rowtype;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type = 'airport' for update;
  if not found then raise exception 'Airport Page not found'; end if;
  if page_record.lifecycle_state <> 'draft' or page_record.current_published_snapshot_id is not null or page_record.published_slug is not null then
    raise exception 'A Published Page cannot be deleted';
  end if;
  insert into public.destination_page_lifecycle_events (page_id, action, admin_identity)
    values (p_page_id, 'delete_draft', p_deleted_by);
  delete from public.destination_pages where id = p_page_id;
  return jsonb_build_object('pageId', p_page_id);
end;
$$;

create or replace function public.archive_destination_page(
  p_page_id uuid,
  p_replacement_slug text default 'airport-transfers',
  p_archived_by text default 'admin'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  page_record public.destination_pages%rowtype;
  target_page public.destination_pages%rowtype;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type = 'airport' for update;
  if not found then raise exception 'Airport Page not found'; end if;
  if page_record.lifecycle_state <> 'published' or page_record.published_slug is null then raise exception 'Only a Published Page can be archived'; end if;
  if p_replacement_slug <> 'airport-transfers' then
    select * into target_page from public.destination_pages
      where published_slug = p_replacement_slug and page_type = 'airport' and lifecycle_state = 'published' and id <> p_page_id;
    if not found then raise exception 'Replacement destination must be a Published Airport Page'; end if;
  end if;
  insert into public.destination_page_redirects (source_slug, target_slug)
    values (page_record.published_slug, p_replacement_slug)
    on conflict (source_slug) do update set target_slug = excluded.target_slug;
  insert into public.destination_page_lifecycle_events (page_id, action, target_slug, admin_identity)
    values (p_page_id, 'archive', p_replacement_slug, p_archived_by);
  update public.destination_pages
    set lifecycle_state = 'archived', featured = false, booking_available = false,
        archived_at = clock_timestamp(), archived_by = p_archived_by, updated_at = clock_timestamp()
    where id = p_page_id;
  return jsonb_build_object('targetSlug', p_replacement_slug);
end;
$$;

create or replace function public.set_destination_booking_availability(
  p_page_id uuid,
  p_available boolean,
  p_changed_by text default 'admin'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  page_record public.destination_pages%rowtype;
  event_name text := case when p_available then 'booking_available' else 'booking_unavailable' end;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type = 'airport' for update;
  if not found or page_record.lifecycle_state <> 'published' then raise exception 'Only a Published Page can change booking availability'; end if;
  update public.destination_pages set booking_available = p_available, updated_at = clock_timestamp() where id = p_page_id;
  insert into public.destination_page_lifecycle_events (page_id, action, admin_identity)
    values (p_page_id, event_name, p_changed_by);
  return jsonb_build_object('bookingAvailable', p_available);
end;
$$;

revoke all on function public.delete_destination_draft(uuid, text) from public, anon, authenticated;
grant execute on function public.delete_destination_draft(uuid, text) to service_role;
revoke all on function public.archive_destination_page(uuid, text, text) from public, anon, authenticated;
grant execute on function public.archive_destination_page(uuid, text, text) to service_role;
revoke all on function public.set_destination_booking_availability(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.set_destination_booking_availability(uuid, boolean, text) to service_role;
