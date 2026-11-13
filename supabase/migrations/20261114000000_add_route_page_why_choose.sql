-- Route pages: a "Why Choose Us" section the admin can write. Empty heading or intro use the
-- site's text; an empty list of points shows the site's standard points.
-- why_points items: { "title": "Fixed fares", "text": "..." }.

alter table public.route_pages
  add column if not exists why_heading text not null default '',
  add column if not exists why_intro text not null default '',
  add column if not exists why_points jsonb not null default '[]'::jsonb;

alter table public.route_pages drop constraint if exists route_pages_why_heading_length;
alter table public.route_pages add constraint route_pages_why_heading_length check (char_length(why_heading) <= 160);
alter table public.route_pages drop constraint if exists route_pages_why_intro_length;
alter table public.route_pages add constraint route_pages_why_intro_length check (char_length(why_intro) <= 600);
alter table public.route_pages drop constraint if exists route_pages_why_points_is_array;
alter table public.route_pages add constraint route_pages_why_points_is_array check (jsonb_typeof(why_points) = 'array');
