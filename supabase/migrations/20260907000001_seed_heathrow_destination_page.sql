-- First database-backed page. This is a separate migration so the seed runs
-- after the schema migration has committed its DDL transaction.
do $seed$
declare
  v_page_id uuid;
  draft_id uuid;
  published_id uuid;
  recovery_id uuid;
begin
  insert into public.destination_pages (
    slug, official_name, display_name, iata_code, service_area,
    google_place_id, address, latitude, longitude, lifecycle_state
  ) values (
    'heathrow-airport-taxi', 'London Heathrow Airport', 'Heathrow', 'LHR', 'Hillingdon',
    'ChIJ6W3FzULyXEcR', 'London Heathrow Airport, Hounslow, UK', 51.4700, -0.4543, 'published'
  ) on conflict (slug) do update set updated_at = now()
  returning id into v_page_id;

  insert into public.destination_page_terminals (page_id, display_name, address, latitude, longitude, sort_order, is_primary)
  values
    (v_page_id, 'London Heathrow (LHR) - Terminal 2', 'Heathrow Terminal 2, Hounslow, UK', 51.4714, -0.4494, 0, true),
    (v_page_id, 'London Heathrow (LHR) - Terminal 3', 'Heathrow Terminal 3, Hounslow, UK', 51.4716, -0.4578, 1, false),
    (v_page_id, 'London Heathrow (LHR) - Terminal 4', 'Heathrow Terminal 4, Hounslow, UK', 51.4595, -0.4470, 2, false),
    (v_page_id, 'London Heathrow (LHR) - Terminal 5', 'Heathrow Terminal 5, Hounslow, UK', 51.4721, -0.4878, 3, false)
  on conflict (page_id, sort_order) do update set
    display_name = excluded.display_name, address = excluded.address,
    latitude = excluded.latitude, longitude = excluded.longitude,
    is_primary = excluded.is_primary;

  insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content)
  values (
    v_page_id, 'draft', 'Heathrow Airport Taxi & Transfers',
    'Fixed-price taxi transfers to and from Heathrow Airport (LHR), all terminals. Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.',
    'Heathrow Airport Taxi & Transfers',
    $$ {"heading":"DRAFT Heathrow Airport Taxi & Transfers","intro":["Fixed-price transfers to and from every Heathrow terminal, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"benefits":[{"title":"Fixed, all-inclusive fare","description":"Your fare is calculated from your exact route and locked in at booking — no surge pricing, no surprise charges on arrival.","icon":"fare"},{"title":"Flight tracking & meet & greet","description":"Your chauffeur tracks your flight and meets you at arrivals, so pickup adjusts automatically if your flight time changes.","icon":"flight"}],"faqs":[{"question":"Which Heathrow terminal will my driver meet me at?","answer":"Tell us your terminal when you book and your chauffeur will meet you there — we track your flight, so pickup adjusts automatically if your terminal or arrival time changes."},{"question":"Is the price fixed for Heathrow transfers?","answer":"Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."},{"question":"What if my flight to or from Heathrow is delayed?","answer":"We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."}]} $$::jsonb
  ) on conflict (page_id, snapshot_kind) do update set
    seo_title = excluded.seo_title, meta_description = excluded.meta_description,
    h1 = excluded.h1, content = excluded.content;

  select snapshots.id into draft_id
  from public.destination_page_snapshots snapshots
  where snapshots.page_id = v_page_id and snapshots.snapshot_kind = 'draft';

  insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content)
  select v_page_id, 'published', snapshots.seo_title, snapshots.meta_description, snapshots.h1,
    jsonb_set(snapshots.content, '{heading}', to_jsonb(snapshots.h1))
  from public.destination_page_snapshots snapshots
  where snapshots.id = draft_id
  on conflict (page_id, snapshot_kind) do update set
    seo_title = excluded.seo_title, meta_description = excluded.meta_description,
    h1 = excluded.h1, content = excluded.content;

  select snapshots.id into published_id
  from public.destination_page_snapshots snapshots
  where snapshots.page_id = v_page_id and snapshots.snapshot_kind = 'published';

  insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content)
  select v_page_id, 'recovery', snapshots.seo_title, snapshots.meta_description, snapshots.h1, snapshots.content
  from public.destination_page_snapshots snapshots
  where snapshots.id = published_id
  on conflict (page_id, snapshot_kind) do update set
    seo_title = excluded.seo_title, meta_description = excluded.meta_description,
    h1 = excluded.h1, content = excluded.content;

  select snapshots.id into recovery_id
  from public.destination_page_snapshots snapshots
  where snapshots.page_id = v_page_id and snapshots.snapshot_kind = 'recovery';
  update public.destination_pages
  set current_draft_snapshot_id = draft_id,
      current_published_snapshot_id = published_id,
      recovery_snapshot_id = recovery_id,
      updated_at = now()
  where id = v_page_id;
end $seed$;
