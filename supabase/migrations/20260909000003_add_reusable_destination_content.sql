create table if not exists public.destination_service_facts (
  id text primary key,
  fact_key text not null unique check (fact_key in ('waiting', 'cancellation', 'flight_tracking', 'meet_and_greet', 'support')),
  title text not null,
  description text not null,
  approved boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.destination_global_faqs (
  id uuid primary key default gen_random_uuid(), question text not null, answer text not null,
  approved boolean not null default true, updated_at timestamptz not null default now()
);

create table if not exists public.destination_verified_reviews (
  id uuid primary key default gen_random_uuid(), quote text not null,
  author text not null default 'Verified customer', source text not null default 'Verified customer review',
  verified_at timestamptz not null default now(), approved boolean not null default true, updated_at timestamptz not null default now()
);

insert into public.destination_service_facts (id, fact_key, title, description) values
  ('waiting', 'waiting', 'Airport waiting time', 'Your booking includes a clear waiting allowance, so you know what is covered before you travel.'),
  ('cancellation', 'cancellation', 'Clear cancellation policy', 'You can review the cancellation terms for your booking before you confirm it.'),
  ('flight-tracking', 'flight_tracking', 'Flight tracking', 'We track your flight and adjust the pickup time when the arrival time changes.'),
  ('meet-and-greet', 'meet_and_greet', 'Meet and greet', 'Your chauffeur meets you at the agreed airport pickup point and helps you start your journey.'),
  ('support', 'support', 'Customer support', 'Our support team is available to help with your airport transfer questions.')
on conflict (id) do update set title = excluded.title, description = excluded.description, approved = true, updated_at = now();

insert into public.destination_global_faqs (question, answer) values
  ('Is my airport transfer price fixed?', 'Yes. The fare shown for your selected route and vehicle is locked in when you book.'),
  ('Can I book a return airport transfer?', 'Yes. Add the return journey to the same booking when you enter your trip details.')
on conflict do nothing;

insert into public.destination_verified_reviews (quote) values
  ('The booking was simple and the driver arrived exactly where we agreed.'),
  ('Clear communication and a comfortable airport journey from start to finish.')
on conflict do nothing;

update public.destination_page_snapshots snapshots
set content = snapshots.content || jsonb_build_object(
  'serviceFacts', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'key', fact_key, 'title', title, 'description', description) order by id), '[]'::jsonb) from public.destination_service_facts where approved),
  'globalFaqs', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'question', question, 'answer', answer) order by updated_at desc), '[]'::jsonb) from public.destination_global_faqs where approved),
  'airportFaqs', coalesce(snapshots.content->'airportFaqs', snapshots.content->'faqs', '[]'::jsonb),
  'reviews', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'quote', quote, 'author', author, 'source', source) order by verified_at desc), '[]'::jsonb) from public.destination_verified_reviews where approved)
)
where snapshots.snapshot_kind in ('draft', 'published', 'recovery');
