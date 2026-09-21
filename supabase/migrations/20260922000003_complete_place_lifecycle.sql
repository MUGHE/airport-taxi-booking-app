-- Complete the safe lifecycle controls for Place Pages.  The RPCs remain
-- service-role only so the browser can never mutate lifecycle state directly.

alter table public.destination_page_redirects drop constraint if exists destination_page_redirects_target_slug_check;
alter table public.destination_page_redirects add constraint destination_page_redirects_target_slug_check
  check (target_slug in ('airport-transfers', 'destinations') or (target_slug = lower(target_slug) and target_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(-airport-taxi)?$'));

create or replace function public.delete_destination_draft(p_page_id uuid, p_deleted_by text default 'admin')
returns jsonb language plpgsql security definer set search_path = public as $$
declare page_record public.destination_pages%rowtype;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type in ('airport', 'place') for update;
  if not found then raise exception 'Destination Page not found'; end if;
  if page_record.lifecycle_state <> 'draft' or page_record.current_published_snapshot_id is not null or page_record.published_slug is not null then raise exception 'A Published Page cannot be deleted'; end if;
  insert into public.destination_page_lifecycle_events (page_id, action, admin_identity) values (p_page_id, 'delete_draft', p_deleted_by);
  delete from public.destination_pages where id = p_page_id;
  return jsonb_build_object('pageId', p_page_id);
end;
$$;

-- Promotion creates only an incomplete Draft.  The source locality remains on
-- its parent until the new Place passes the normal publish checks.
create or replace function public.promote_covered_locality_to_place(
  p_parent_page_id uuid,
  p_locality_id uuid,
  p_slug text,
  p_place_type text,
  p_place_group_id uuid,
  p_promoted_by text default 'admin'
)
returns uuid language plpgsql security definer set search_path = public as $$
declare parent_page public.destination_pages%rowtype; locality_record public.destination_covered_localities%rowtype; new_page_id uuid; snapshot_id uuid;
begin
  select * into parent_page from public.destination_pages where id = p_parent_page_id and page_type = 'place' and lifecycle_state <> 'archived';
  if not found then raise exception 'A valid Published or Draft parent Place is required'; end if;
  select * into locality_record from public.destination_covered_localities where id = p_locality_id and page_id = p_parent_page_id;
  if not found then raise exception 'Covered Locality not found on the selected parent'; end if;
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or p_slug ~ '-airport-taxi$' then raise exception 'Invalid Place Slug'; end if;
  if exists (select 1 from public.destination_pages where slug = p_slug) then raise exception 'Place Slug is already in use'; end if;
  insert into public.destination_pages (page_type, lifecycle_state, slug, official_name, display_name, place_type, place_group_id, primary_parent_id, booking_available, content_schema_version)
    values ('place', 'draft', p_slug, locality_record.name, locality_record.name, p_place_type, p_place_group_id, p_parent_page_id, true, 3) returning id into new_page_id;
  insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content)
    values (new_page_id, 'draft', locality_record.name || ' Airport Taxi | Fixed-Price Transfers', 'Fixed-price taxi transfers between ' || locality_record.name || ' and supported airports.', locality_record.name || ' Airport Taxi', jsonb_build_object('schemaVersion', 3, 'hero', jsonb_build_object('heading', locality_record.name || ' Airport Taxi', 'body', '[]'::jsonb), 'sections', '[]'::jsonb, 'finalCta', jsonb_build_object('heading', 'Get a fixed price', 'body', '[]'::jsonb), 'serviceFacts', '[]'::jsonb, 'globalFaqs', '[]'::jsonb, 'airportFaqs', '[]'::jsonb, 'placeFaqs', '[]'::jsonb, 'reviews', '[]'::jsonb)) returning id into snapshot_id;
  update public.destination_pages set current_draft_snapshot_id = snapshot_id where id = new_page_id;
  return new_page_id;
end;
$$;

create or replace function public.publish_destination_page(
  p_page_id uuid,
  p_published_by text default 'admin',
  p_override jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  page_record public.destination_pages%rowtype;
  draft_record public.destination_page_snapshots%rowtype;
  old_published public.destination_page_snapshots%rowtype;
  new_published_id uuid;
  published_at_value timestamptz := clock_timestamp();
  old_slug text;
begin
  select * into page_record from public.destination_pages
    where id = p_page_id and page_type in ('airport', 'place') for update;
  if not found then raise exception 'Destination Page not found'; end if;
  if page_record.slug is null or (page_record.page_type = 'airport' and page_record.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*-airport-taxi$')
    or (page_record.page_type = 'place' and (page_record.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or page_record.slug ~ '-airport-taxi$')) then
    raise exception 'Invalid % Slug', initcap(page_record.page_type);
  end if;
  if exists (select 1 from public.destination_pages where slug = page_record.slug and id <> p_page_id) then
    raise exception '% Slug is already in use', initcap(page_record.page_type);
  end if;
  if exists (select 1 from public.destination_page_redirects where source_slug = page_record.slug and source_slug <> coalesce(page_record.published_slug, '')) then
    raise exception '% Slug conflicts with an existing redirect', initcap(page_record.page_type);
  end if;
  select * into draft_record from public.destination_page_snapshots
    where id = page_record.current_draft_snapshot_id and page_id = p_page_id and snapshot_kind = 'draft';
  if not found then raise exception 'A Draft Snapshot is required before publishing'; end if;
  if trim(draft_record.seo_title) = '' or trim(draft_record.meta_description) = '' or trim(draft_record.h1) = '' then
    raise exception 'SEO title, meta description, and H1 are required';
  end if;
  if exists (select 1 from public.destination_page_snapshots where snapshot_kind = 'published' and lower(seo_title) = lower(draft_record.seo_title) and page_id <> p_page_id) then
    raise exception 'Duplicate published SEO title';
  end if;

  -- The application performs the complete readiness check.  These database
  -- checks are the final transaction boundary and protect direct RPC callers.
  if page_record.page_type = 'place' then
    if page_record.google_place_id is null or trim(page_record.google_place_id) = '' or page_record.address is null or trim(page_record.address) = ''
      or page_record.latitude is null or page_record.longitude is null then raise exception 'A confirmed Place location is required'; end if;
    if (select count(*) from jsonb_array_elements(coalesce(draft_record.content->'placeFaqs', '[]'::jsonb)) f where trim(f->>'question') <> '' and trim(f->>'answer') <> '') < 2 then
      raise exception 'At least two local FAQs are required'; end if;
    if (select count(*) from public.destination_page_relationships r join public.destination_pages a on a.id = case when r.page_a_id = p_page_id then r.page_b_id else r.page_a_id end where (r.page_a_id = p_page_id or r.page_b_id = p_page_id) and r.relationship_kind = 'supported_airport' and a.page_type = 'airport' and a.lifecycle_state = 'published' and a.booking_available) < 1 then
      raise exception 'At least one Supported Airport must accept bookings'; end if;
  else
    if (select count(*) from jsonb_array_elements(coalesce(draft_record.content->'airportFaqs', '[]'::jsonb)) f where trim(f->>'question') <> '' and trim(f->>'answer') <> '') < 3 then
      raise exception 'At least three airport-specific FAQs are required'; end if;
    if (select count(*) from jsonb_array_elements(coalesce(draft_record.content->'sections', '[]'::jsonb)) s where s->>'type' in ('introduction','benefits','fleet_pricing','airport_guide','map') and coalesce((s->>'visible')::boolean, false)) < 5 then
      raise exception 'All required Airport Page sections must be visible'; end if;
    if (select count(*) from public.destination_page_relationships r join public.destination_pages related on related.id = case when r.page_a_id = p_page_id then r.page_b_id else r.page_a_id end where (r.page_a_id = p_page_id or r.page_b_id = p_page_id) and related.lifecycle_state = 'published') < 3 then
      raise exception 'At least three related Published Pages are required'; end if;
  end if;

  old_slug := page_record.published_slug;
  if page_record.current_published_snapshot_id is not null then
    select * into old_published from public.destination_page_snapshots where id = page_record.current_published_snapshot_id for update;
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at)
      values (p_page_id, 'recovery', old_published.seo_title, old_published.meta_description, old_published.h1, old_published.content, published_at_value)
      on conflict (page_id, snapshot_kind) do update set seo_title = excluded.seo_title, meta_description = excluded.meta_description, h1 = excluded.h1, content = excluded.content, created_at = excluded.created_at;
    new_published_id := page_record.current_published_snapshot_id;
    update public.destination_page_snapshots set seo_title = draft_record.seo_title, meta_description = draft_record.meta_description, h1 = draft_record.h1, content = draft_record.content, created_at = published_at_value where id = new_published_id;
  else
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at)
      values (p_page_id, 'published', draft_record.seo_title, draft_record.meta_description, draft_record.h1, draft_record.content, published_at_value) returning id into new_published_id;
  end if;
  if old_slug is not null and old_slug <> page_record.slug then
    if exists (select 1 from public.destination_page_redirects where source_slug = page_record.slug and target_slug <> page_record.slug) then raise exception 'New Slug conflicts with an existing redirect'; end if;
    if exists (select 1 from public.destination_page_redirects where source_slug = old_slug and target_slug <> page_record.slug) then raise exception 'Previous Slug conflicts with an existing redirect'; end if;
    update public.destination_page_redirects set target_slug = page_record.slug where target_slug = old_slug and source_slug <> old_slug;
    insert into public.destination_page_redirects (source_slug, target_slug) values (old_slug, page_record.slug) on conflict (source_slug) do update set target_slug = excluded.target_slug;
  end if;
  update public.destination_pages set lifecycle_state = 'published', current_published_snapshot_id = new_published_id,
    recovery_snapshot_id = (select id from public.destination_page_snapshots where page_id = p_page_id and snapshot_kind = 'recovery'),
    published_slug = slug, published_at = published_at_value, published_by = p_published_by, updated_at = published_at_value where id = p_page_id;
  if page_record.page_type = 'place' and page_record.primary_parent_id is not null then
    insert into public.destination_page_relationships (page_a_id, page_b_id, a_heading, a_description, b_heading, b_description, relationship_kind, place_display_order)
      select least(p_page_id, page_record.primary_parent_id), greatest(p_page_id, page_record.primary_parent_id), '', '', '', '', 'nearby_place', coalesce((select max(place_display_order) + 1 from public.destination_page_relationships where (page_a_id = page_record.primary_parent_id or page_b_id = page_record.primary_parent_id) and relationship_kind = 'nearby_place'), 0)
      where exists (select 1 from public.destination_pages where id = page_record.primary_parent_id and page_type = 'place' and lifecycle_state = 'published')
      on conflict (page_a_id, page_b_id) do update set relationship_kind = 'nearby_place';
  end if;
  return jsonb_build_object('slug', page_record.slug);
end;
$$;

create or replace function public.restore_destination_page(p_page_id uuid, p_restored_by text default 'admin')
returns jsonb language plpgsql security definer set search_path = public as $$
declare page_record public.destination_pages%rowtype; recovery_record public.destination_page_snapshots%rowtype; restored_at timestamptz := clock_timestamp();
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type in ('airport', 'place') for update;
  if not found then raise exception 'Destination Page not found'; end if;
  if page_record.lifecycle_state <> 'published' then raise exception 'Only a Published Page can be restored'; end if;
  select * into recovery_record from public.destination_page_snapshots where page_id = p_page_id and snapshot_kind = 'recovery' and (page_record.recovery_snapshot_id is null or id = page_record.recovery_snapshot_id);
  if not found then raise exception 'Recovery Snapshot is not available'; end if;
  if page_record.current_draft_snapshot_id is null then
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at) values (p_page_id, 'draft', recovery_record.seo_title, recovery_record.meta_description, recovery_record.h1, recovery_record.content, restored_at) returning id into page_record.current_draft_snapshot_id;
    update public.destination_pages set current_draft_snapshot_id = page_record.current_draft_snapshot_id, updated_at = restored_at where id = p_page_id;
  else
    update public.destination_page_snapshots set seo_title = recovery_record.seo_title, meta_description = recovery_record.meta_description, h1 = recovery_record.h1, content = recovery_record.content, created_at = restored_at where id = page_record.current_draft_snapshot_id and snapshot_kind = 'draft';
    update public.destination_pages set updated_at = restored_at where id = p_page_id;
  end if;
  return jsonb_build_object('pageId', p_page_id);
end;
$$;

create or replace function public.archive_destination_page(p_page_id uuid, p_replacement_slug text default null, p_archived_by text default 'admin')
returns jsonb language plpgsql security definer set search_path = public as $$
declare page_record public.destination_pages%rowtype; target_page public.destination_pages%rowtype; fallback text;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type in ('airport', 'place') for update;
  if not found then raise exception 'Destination Page not found'; end if;
  if page_record.lifecycle_state <> 'published' or page_record.published_slug is null then raise exception 'Only a Published Page can be archived'; end if;
  fallback := case when page_record.page_type = 'place' then 'destinations' else 'airport-transfers' end;
  if coalesce(nullif(trim(p_replacement_slug), ''), fallback) <> fallback then
    select * into target_page from public.destination_pages where published_slug = trim(p_replacement_slug) and page_type = page_record.page_type and lifecycle_state = 'published' and id <> p_page_id;
    if not found then raise exception 'Replacement destination must be a Published % Page', initcap(page_record.page_type); end if;
  end if;
  insert into public.destination_page_redirects (source_slug, target_slug) values (page_record.published_slug, coalesce(nullif(trim(p_replacement_slug), ''), fallback)) on conflict (source_slug) do update set target_slug = excluded.target_slug;
  update public.destination_pages set lifecycle_state = 'archived', featured = false, booking_available = false, archived_at = clock_timestamp(), archived_by = p_archived_by, updated_at = clock_timestamp() where id = p_page_id;
  return jsonb_build_object('targetSlug', coalesce(nullif(trim(p_replacement_slug), ''), fallback));
end;
$$;

create or replace function public.set_destination_booking_availability(p_page_id uuid, p_available boolean, p_changed_by text default 'admin')
returns jsonb language plpgsql security definer set search_path = public as $$
declare page_record public.destination_pages%rowtype;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type in ('airport', 'place') for update;
  if not found or page_record.lifecycle_state <> 'published' then raise exception 'Only a Published Page can change booking availability'; end if;
  update public.destination_pages set booking_available = p_available, updated_at = clock_timestamp() where id = p_page_id;
  insert into public.destination_page_lifecycle_events (page_id, action, admin_identity) values (p_page_id, case when p_available then 'booking_available' else 'booking_unavailable' end, p_changed_by);
  return jsonb_build_object('bookingAvailable', p_available);
end;
$$;

revoke all on function public.delete_destination_draft(uuid, text), public.promote_covered_locality_to_place(uuid, uuid, text, text, uuid, text), public.publish_destination_page(uuid, text, jsonb), public.restore_destination_page(uuid, text), public.archive_destination_page(uuid, text, text), public.set_destination_booking_availability(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.delete_destination_draft(uuid, text), public.promote_covered_locality_to_place(uuid, uuid, text, text, uuid, text), public.publish_destination_page(uuid, text, jsonb), public.restore_destination_page(uuid, text), public.archive_destination_page(uuid, text, text), public.set_destination_booking_availability(uuid, boolean, text) to service_role;
