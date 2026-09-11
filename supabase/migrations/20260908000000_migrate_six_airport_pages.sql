-- Move the six existing airport pages into the Destination Page model before
-- the public route starts using canonical airport-taxi slugs.

create table if not exists public.destination_page_redirects (
  source_slug text primary key check (source_slug = lower(source_slug) and source_slug <> ''),
  target_slug text not null check (target_slug = lower(target_slug) and target_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-airport-taxi$'),
  created_at timestamptz not null default now(),
  check (source_slug <> target_slug)
);

create table if not exists public.destination_media_assets (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('legacy', 'cloudinary')),
  public_id text not null,
  delivery_url text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  format text not null,
  alt_text text not null,
  source_owner text not null,
  licence_note text not null,
  rights_confirmed boolean not null default false,
  uploaded_at timestamptz not null default now(),
  unique (provider, public_id)
);

create table if not exists public.destination_snapshot_media (
  snapshot_id uuid not null references public.destination_page_snapshots(id) on delete cascade,
  media_asset_id uuid not null references public.destination_media_assets(id) on delete restrict,
  purpose text not null check (purpose in ('hero', 'section')),
  sort_order integer not null default 0 check (sort_order >= 0),
  primary key (snapshot_id, purpose, sort_order)
);

do $seed$
declare
  airport jsonb;
  terminal jsonb;
  v_page_id uuid;
  v_snapshot_id uuid;
  v_media_id uuid;
  v_snapshot_kind text;
  v_terminal_index integer;
  airports jsonb := $json$
[
  {
    "slug":"heathrow-airport-taxi","legacy":"heathrow","official":"London Heathrow Airport","display":"Heathrow","iata":"LHR","area":"Hillingdon","place":"ChIJ6W3FzULyXEcR","address":"London Heathrow Airport, Hounslow, UK","lat":51.4700,"lng":-0.4543,"image":"/hero-airport-transfer.png","alt":"Heathrow Airport terminal transfer service","terminals":[["London Heathrow (LHR) - Terminal 2","Heathrow Terminal 2, Hounslow, UK",51.4714,-0.4494],["London Heathrow (LHR) - Terminal 3","Heathrow Terminal 3, Hounslow, UK",51.4716,-0.4578],["London Heathrow (LHR) - Terminal 4","Heathrow Terminal 4, Hounslow, UK",51.4595,-0.4470],["London Heathrow (LHR) - Terminal 5","Heathrow Terminal 5, Hounslow, UK",51.4721,-0.4878]],"content":{"seo":"Heathrow Airport Taxi & Transfers","description":"Fixed-price taxi transfers to and from Heathrow Airport (LHR), all terminals. Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.","intro":["Fixed-price transfers to and from every Heathrow terminal, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"faqs":[["Which Heathrow terminal will my driver meet me at?","Tell us your terminal when you book and your chauffeur will meet you there — we track your flight, so pickup adjusts automatically if your terminal or arrival time changes."],["Is the price fixed for Heathrow transfers?","Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."],["What if my flight to or from Heathrow is delayed?","We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."]]}},
  {
    "slug":"gatwick-airport-taxi","legacy":"gatwick","official":"London Gatwick Airport","display":"Gatwick","iata":"LGW","area":"Crawley","place":"ChIJ8W0U5wqxdUgR","address":"London Gatwick Airport, Crawley, UK","lat":51.1537,"lng":-0.1821,"image":"/airport-transfers/gatwick.webp","alt":"Gatwick Airport terminal transfer service","terminals":[["London Gatwick (LGW) - North Terminal","Gatwick North Terminal, Crawley, UK",51.1601,-0.1771],["London Gatwick (LGW) - South Terminal","Gatwick South Terminal, Crawley, UK",51.1492,-0.1587]],"content":{"seo":"Gatwick Airport Taxi & Transfers","description":"Fixed-price taxi transfers to and from Gatwick Airport (LGW), North and South Terminal. Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.","intro":["Fixed-price transfers to and from Gatwick's North and South Terminal, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"faqs":[["Do you cover both Gatwick terminals?","Yes — North Terminal and South Terminal are both covered. Tell us which one when you book and your chauffeur will meet you there."],["Is the price fixed for Gatwick transfers?","Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."],["What if my flight to or from Gatwick is delayed?","We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."]]}},
  {
    "slug":"stansted-airport-taxi","legacy":"stansted","official":"London Stansted Airport","display":"Stansted","iata":"STN","area":"Uttlesford","place":"ChIJq1Wq8d8c2EcR","address":"London Stansted Airport, Stansted, UK","lat":51.8850,"lng":0.2350,"image":"/airport-transfers/gatwick.webp","alt":"Stansted Airport transfer service","terminals":[["London Stansted (STN)","Stansted Airport, Stansted, UK",51.8850,0.2350]],"content":{"seo":"Stansted Airport Taxi & Transfers","description":"Fixed-price taxi transfers to and from Stansted Airport (STN). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.","intro":["Fixed-price transfers to and from Stansted Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"faqs":[["Is the price fixed for Stansted transfers?","Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."],["What if my flight to or from Stansted is delayed?","We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."],["Can I add a return trip from Stansted?","Yes — add a return leg to the same booking on the Details step, often at a discount."]]}},
  {
    "slug":"luton-airport-taxi","legacy":"luton","official":"London Luton Airport","display":"Luton","iata":"LTN","area":"Luton","place":"ChIJb7bYwDgzd0gR","address":"London Luton Airport, Luton, UK","lat":51.8747,"lng":-0.3683,"image":"/airport-transfers/luton.webp","alt":"Luton Airport transfer service","terminals":[["London Luton (LTN)","Luton Airport, Luton, UK",51.8747,-0.3683]],"content":{"seo":"Luton Airport Taxi & Transfers","description":"Fixed-price taxi transfers to and from Luton Airport (LTN). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.","intro":["Fixed-price transfers to and from Luton Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"faqs":[["Is the price fixed for Luton transfers?","Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."],["What if my flight to or from Luton is delayed?","We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."],["Can I add a return trip from Luton?","Yes — add a return leg to the same booking on the Details step, often at a discount."]]}},
  {
    "slug":"london-city-airport-taxi","legacy":"london-city","official":"London City Airport","display":"London City","iata":"LCY","area":"Newham","place":"ChIJt7x7y7QcdkgR","address":"London City Airport, London, UK","lat":51.5053,"lng":0.0553,"image":"/airport-transfers/london-city.webp","alt":"London City Airport transfer service","terminals":[["London City (LCY)","London City Airport, London, UK",51.5053,0.0553]],"content":{"seo":"London City Airport Taxi & Transfers","description":"Fixed-price taxi transfers to and from London City Airport (LCY). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.","intro":["Fixed-price transfers to and from London City Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"faqs":[["Is the price fixed for London City transfers?","Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."],["What if my flight to or from London City is delayed?","We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."],["Can I add a return trip from London City?","Yes — add a return leg to the same booking on the Details step, often at a discount."]]}},
  {
    "slug":"southend-airport-taxi","legacy":"southend","official":"London Southend Airport","display":"Southend","iata":"SEN","area":"Southend-on-Sea","place":"ChIJh8Q4w8Wl2EcR","address":"London Southend Airport, Southend-on-Sea, UK","lat":51.5714,"lng":0.6956,"image":"/airport-transfers/southend.webp","alt":"Southend Airport transfer service","terminals":[["London Southend (SEN)","Southend Airport, Southend-on-Sea, UK",51.5714,0.6956]],"content":{"seo":"Southend Airport Taxi & Transfers","description":"Fixed-price taxi transfers to and from Southend Airport (SEN). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.","intro":["Fixed-price transfers to and from Southend Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.","Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed."],"faqs":[["Is the price fixed for Southend transfers?","Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day."],["What if my flight to or from Southend is delayed?","We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival."],["Can I add a return trip from Southend?","Yes — add a return leg to the same booking on the Details step, often at a discount."]]} }
]$json$;
begin
  for airport in select * from jsonb_array_elements(airports) loop
    insert into public.destination_pages (
      slug, official_name, display_name, iata_code, service_area,
      google_place_id, address, latitude, longitude, lifecycle_state
    ) values (
      airport->>'slug', airport->>'official', airport->>'display', airport->>'iata', airport->>'area',
      airport->>'place', airport->>'address', (airport->>'lat')::double precision, (airport->>'lng')::double precision, 'published'
    ) on conflict (slug) do update set
      official_name = excluded.official_name, display_name = excluded.display_name,
      iata_code = excluded.iata_code, service_area = excluded.service_area,
      google_place_id = excluded.google_place_id, address = excluded.address,
      latitude = excluded.latitude, longitude = excluded.longitude,
      lifecycle_state = 'published', updated_at = now()
    returning id into v_page_id;

    for terminal, v_terminal_index in select value, ordinality::integer - 1 from jsonb_array_elements(airport->'terminals') with ordinality loop
      insert into public.destination_page_terminals (page_id, display_name, address, latitude, longitude, sort_order, is_primary)
      values (v_page_id, terminal->>0, terminal->>1, (terminal->>2)::double precision, (terminal->>3)::double precision, v_terminal_index, v_terminal_index = 0)
      on conflict (page_id, sort_order) do update set
        display_name = excluded.display_name, address = excluded.address,
        latitude = excluded.latitude, longitude = excluded.longitude, is_primary = excluded.is_primary;
    end loop;

    insert into public.destination_media_assets (provider, public_id, delivery_url, width, height, format, alt_text, source_owner, licence_note, rights_confirmed)
    values ('legacy', 'airport-pages/' || (airport->>'slug'), airport->>'image', 1600, 900, case when right(airport->>'image', 4) = '.png' then 'png' else 'webp' end, airport->>'alt', 'ONE Airport Taxi', 'Existing first-party airport imagery retained during migration.', true)
    on conflict (provider, public_id) do update set
      delivery_url = excluded.delivery_url, alt_text = excluded.alt_text, rights_confirmed = excluded.rights_confirmed
    returning id into v_media_id;

    for v_snapshot_kind in select unnest(array['draft', 'published', 'recovery']) loop
      insert into public.destination_page_snapshots (page_id, snapshot_kind, seo_title, meta_description, h1, content)
      values (
        v_page_id, v_snapshot_kind, airport->'content'->>'seo', airport->'content'->>'description', airport->'content'->>'seo',
        jsonb_build_object(
          'heading', airport->'content'->>'seo',
          'intro', airport->'content'->'intro',
          'benefits', jsonb_build_array(
            jsonb_build_object('title','Fixed, all-inclusive fare','description','Your fare is calculated from your exact route and locked in at booking — no surge pricing, no surprise charges on arrival.','icon','fare'),
            jsonb_build_object('title','Flight tracking & meet & greet','description','Your chauffeur tracks your flight and meets you at arrivals, so pickup adjusts automatically if your flight time changes.','icon','flight')
          ),
          'faqs', (select jsonb_agg(jsonb_build_object('question', faq->>0, 'answer', faq->>1)) from jsonb_array_elements(airport->'content'->'faqs') faq),
          'media', jsonb_build_array(jsonb_build_object('purpose','hero','publicId','airport-pages/' || (airport->>'slug')))
        )
      ) on conflict (page_id, snapshot_kind) do update set
        seo_title = excluded.seo_title, meta_description = excluded.meta_description,
        h1 = excluded.h1, content = excluded.content;

      select snapshots.id into v_snapshot_id from public.destination_page_snapshots snapshots where snapshots.page_id = v_page_id and snapshots.snapshot_kind = v_snapshot_kind;
      insert into public.destination_snapshot_media (snapshot_id, media_asset_id, purpose, sort_order)
      values (v_snapshot_id, v_media_id, 'hero', 0)
      on conflict do nothing;

      update public.destination_pages
      set current_draft_snapshot_id = case when v_snapshot_kind = 'draft' then v_snapshot_id else current_draft_snapshot_id end,
          current_published_snapshot_id = case when v_snapshot_kind = 'published' then v_snapshot_id else current_published_snapshot_id end,
          recovery_snapshot_id = case when v_snapshot_kind = 'recovery' then v_snapshot_id else recovery_snapshot_id end,
          updated_at = now()
      where destination_pages.id = v_page_id;
    end loop;

    insert into public.destination_page_redirects (source_slug, target_slug)
    values (airport->>'legacy', airport->>'slug')
    on conflict (source_slug) do update set target_slug = excluded.target_slug;
  end loop;
end $seed$;
