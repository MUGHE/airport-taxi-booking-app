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
  related_count integer;
  faq_count integer;
  section_count integer;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type = 'airport' for update;
  if not found then raise exception 'Airport Page not found'; end if;
  if page_record.slug is null or page_record.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*-airport-taxi$' then raise exception 'Invalid Airport Slug'; end if;
  if exists (select 1 from public.destination_pages where slug = page_record.slug and id <> p_page_id) then raise exception 'Airport Slug is already in use'; end if;
  if exists (select 1 from public.destination_page_redirects where source_slug = page_record.slug and source_slug <> coalesce(page_record.published_slug, '')) then raise exception 'Airport Slug conflicts with an existing redirect'; end if;

  select * into draft_record from public.destination_page_snapshots where id = page_record.current_draft_snapshot_id and page_id = p_page_id and snapshot_kind = 'draft';
  if not found then raise exception 'A Draft Snapshot is required before publishing'; end if;
  if draft_record.seo_title = '' or draft_record.meta_description = '' then raise exception 'SEO title and meta description are required'; end if;
  if exists (select 1 from public.destination_page_snapshots where snapshot_kind = 'published' and lower(seo_title) = lower(draft_record.seo_title) and page_id <> p_page_id) then raise exception 'Duplicate published SEO title'; end if;
  select count(*) into faq_count from jsonb_array_elements(coalesce(draft_record.content->'airportFaqs', '[]'::jsonb)) faq where length(trim(faq->>'question')) > 0 and length(trim(faq->>'answer')) > 0;
  if faq_count < 3 then raise exception 'At least three airport-specific FAQs are required'; end if;
  select count(*) into section_count from jsonb_array_elements(coalesce(draft_record.content->'sections', '[]'::jsonb)) section where section->>'type' in ('introduction','benefits','fleet_pricing','airport_guide','map') and coalesce((section->>'visible')::boolean, false);
  if section_count < 5 then raise exception 'All required Airport Page sections must be visible'; end if;
  select count(*) into related_count from public.destination_page_relationships relationship join public.destination_pages related on related.id = case when relationship.page_a_id = p_page_id then relationship.page_b_id else relationship.page_a_id end where (relationship.page_a_id = p_page_id or relationship.page_b_id = p_page_id) and related.lifecycle_state = 'published';
  if related_count < 3 then raise exception 'At least three related Published Pages are required'; end if;

  if jsonb_array_length(coalesce(p_override->'warningCodes', '[]'::jsonb)) > 0 then
    insert into public.destination_publish_quality_overrides (page_id, warning_codes, warning_reasons, admin_identity)
      values (p_page_id, array(select jsonb_array_elements_text(p_override->'warningCodes')), coalesce(p_override->'warningReasons', '[]'::jsonb), p_published_by);
  end if;

  if page_record.current_published_snapshot_id is not null then
    select * into old_published from public.destination_page_snapshots where id = page_record.current_published_snapshot_id for update;
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at)
      values (p_page_id, 'recovery', old_published.seo_title, old_published.meta_description, old_published.h1, old_published.content, published_at_value)
      on conflict (page_id, snapshot_kind) do update set seo_title = excluded.seo_title, meta_description = excluded.meta_description, h1 = excluded.h1, content = excluded.content, created_at = excluded.created_at;
    update public.destination_page_snapshots set seo_title = draft_record.seo_title, meta_description = draft_record.meta_description, h1 = draft_record.h1, content = draft_record.content, created_at = published_at_value where id = page_record.current_published_snapshot_id;
    new_published_id := page_record.current_published_snapshot_id;
  else
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at) values (p_page_id, 'published', draft_record.seo_title, draft_record.meta_description, draft_record.h1, draft_record.content, published_at_value) returning id into new_published_id;
  end if;

  update public.destination_page_snapshots
    set seo_title = draft_record.seo_title, meta_description = draft_record.meta_description, h1 = draft_record.h1, content = draft_record.content, created_at = published_at_value
    where id = page_record.current_draft_snapshot_id;

  if page_record.published_slug is not null and page_record.published_slug <> page_record.slug then
    if exists (select 1 from public.destination_page_redirects where source_slug = page_record.slug and target_slug <> page_record.slug) then raise exception 'Airport Slug conflicts with an existing redirect'; end if;
    if exists (select 1 from public.destination_page_redirects where source_slug = page_record.published_slug and target_slug <> page_record.slug) then raise exception 'Previous Airport Slug conflicts with an existing redirect'; end if;
    update public.destination_page_redirects set target_slug = page_record.slug where target_slug = page_record.published_slug and source_slug <> page_record.published_slug;
    insert into public.destination_page_redirects (source_slug, target_slug) values (page_record.published_slug, page_record.slug) on conflict (source_slug) do update set target_slug = excluded.target_slug;
  end if;

  update public.destination_pages set lifecycle_state = 'published', current_published_snapshot_id = new_published_id, recovery_snapshot_id = case when page_record.current_published_snapshot_id is not null then (select id from public.destination_page_snapshots where page_id = p_page_id and snapshot_kind = 'recovery') else recovery_snapshot_id end, published_slug = slug, published_at = published_at_value, published_by = p_published_by, updated_at = published_at_value where id = p_page_id;
  return jsonb_build_object('slug', page_record.slug);
end;
$$;

create or replace function public.restore_destination_page(p_page_id uuid, p_restored_by text default 'admin')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  page_record public.destination_pages%rowtype;
  recovery_record public.destination_page_snapshots%rowtype;
  restored_at timestamptz := clock_timestamp();
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type = 'airport' for update;
  if not found then raise exception 'Airport Page not found'; end if;
  if page_record.lifecycle_state <> 'published' then raise exception 'Only a Published Page can be restored'; end if;
  select * into recovery_record from public.destination_page_snapshots where page_id = p_page_id and snapshot_kind = 'recovery' and (page_record.recovery_snapshot_id is null or id = page_record.recovery_snapshot_id);
  if not found then raise exception 'Recovery Snapshot is not available'; end if;
  if page_record.current_draft_snapshot_id is null then
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at)
      values (p_page_id, 'draft', recovery_record.seo_title, recovery_record.meta_description, recovery_record.h1, recovery_record.content, restored_at)
      returning id into page_record.current_draft_snapshot_id;
    update public.destination_pages set current_draft_snapshot_id = page_record.current_draft_snapshot_id, updated_at = restored_at where id = p_page_id;
  else
    update public.destination_page_snapshots set seo_title = recovery_record.seo_title, meta_description = recovery_record.meta_description, h1 = recovery_record.h1, content = recovery_record.content, created_at = restored_at where id = page_record.current_draft_snapshot_id and snapshot_kind = 'draft';
    update public.destination_pages set updated_at = restored_at where id = p_page_id;
  end if;
  return jsonb_build_object('pageId', p_page_id);
end;
$$;

revoke all on function public.publish_destination_page(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.publish_destination_page(uuid, text, jsonb) to service_role;
revoke all on function public.restore_destination_page(uuid, text) from public, anon, authenticated;
grant execute on function public.restore_destination_page(uuid, text) to service_role;
