-- Drafts may be built one tab at a time. Publish validation still requires
-- every identity and location field before a page can become public.
alter table public.destination_pages
  alter column slug drop not null,
  alter column official_name drop not null,
  alter column display_name drop not null,
  alter column iata_code drop not null,
  alter column service_area drop not null,
  alter column google_place_id drop not null,
  alter column address drop not null,
  alter column latitude drop not null,
  alter column longitude drop not null;
