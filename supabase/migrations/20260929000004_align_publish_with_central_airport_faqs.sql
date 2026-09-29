-- Airport FAQs are managed in public.airport_faqs, not in each page snapshot.
-- The previous publish function still enforced the old page-level FAQ field,
-- which is intentionally empty for Airport Pages after central FAQ migration.

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

  -- The application performs the complete readiness check. These database
  -- checks are the final transaction boundary and protect direct RPC callers.
  if page_record.page_type = 'place' then
    if page_record.google_place_id is null or trim(page_record.google_place_id) = '' or page_record.address is null or trim(page_record.address) = ''
      or page_record.latitude is null or page_record.longitude is null then raise exception 'A confirmed Place location is required'; end if;
    if (select count(*) from jsonb_array_elements(coalesce(draft_record.content->'placeFaqs', '[]'::jsonb)) f where trim(f->>'question') <> '' and trim(f->>'answer') <> '') < 2 then
      raise exception 'At least two local FAQs are required'; end if;
    if (select count(*) from public.destination_page_relationships r join public.destination_pages a on a.id = case when r.page_a_id = p_page_id then r.page_b_id else r.page_a_id end where (r.page_a_id = p_page_id or r.page_b_id = p_page_id) and r.relationship_kind = 'supported_airport' and a.page_type = 'airport' and a.lifecycle_state = 'published' and a.booking_available) < 1 then
      raise exception 'At least one Supported Airport must accept bookings'; end if;
  else
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

revoke all on function public.publish_destination_page(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.publish_destination_page(uuid, text, jsonb) to service_role;
