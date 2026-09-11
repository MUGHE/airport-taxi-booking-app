create table if not exists public.destination_publish_quality_overrides (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.destination_pages(id) on delete cascade,
  warning_codes text[] not null,
  warning_reasons jsonb not null check (jsonb_typeof(warning_reasons) = 'array'),
  confirmed_at timestamptz not null default now(),
  admin_identity text not null
);

create index if not exists destination_publish_quality_overrides_page_idx
  on public.destination_publish_quality_overrides (page_id, confirmed_at desc);

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
  related_count integer;
  faq_count integer;
  section_count integer;
begin
  select * into page_record from public.destination_pages where id = p_page_id and page_type = 'airport' for update;
  if not found then raise exception 'Airport Page not found'; end if;
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
      values (p_page_id, 'recovery', old_published.seo_title, old_published.meta_description, old_published.h1, old_published.content, now())
      on conflict (page_id, snapshot_kind) do update set seo_title = excluded.seo_title, meta_description = excluded.meta_description, h1 = excluded.h1, content = excluded.content, created_at = excluded.created_at;
    update public.destination_page_snapshots set seo_title = draft_record.seo_title, meta_description = draft_record.meta_description, h1 = draft_record.h1, content = draft_record.content, created_at = now() where id = page_record.current_published_snapshot_id;
    new_published_id := page_record.current_published_snapshot_id;
  else
    insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content) values (p_page_id, 'published', draft_record.seo_title, draft_record.meta_description, draft_record.h1, draft_record.content) returning id into new_published_id;
  end if;
  if page_record.published_slug is not null and page_record.published_slug <> page_record.slug then
    insert into public.destination_page_redirects (source_slug, target_slug) values (page_record.published_slug, page_record.slug) on conflict (source_slug) do update set target_slug = excluded.target_slug;
  end if;
  update public.destination_pages set lifecycle_state = 'published', current_published_snapshot_id = new_published_id, published_slug = slug, published_at = now(), published_by = p_published_by, updated_at = now() where id = p_page_id;
  return jsonb_build_object('slug', page_record.slug);
end;
$$;

revoke all on function public.publish_destination_page(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.publish_destination_page(uuid, text, jsonb) to service_role;
