create table if not exists public.airport_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  approved boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.airport_faqs (id, question, answer, approved, sort_order, updated_at)
select id, question, answer, approved,
  row_number() over (order by updated_at asc, id)::integer - 1,
  updated_at
from public.destination_global_faqs
on conflict (id) do nothing;
