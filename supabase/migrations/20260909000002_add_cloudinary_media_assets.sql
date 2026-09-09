create table if not exists public.cloudinary_media_assets (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  secure_url text not null check (secure_url like 'https://%'),
  resource_type text not null default 'image' check (resource_type = 'image'),
  version bigint,
  kind text not null check (kind in ('hero', 'content')),
  format text not null check (lower(format) in ('jpg', 'jpeg', 'png', 'webp', 'avif')),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes integer not null check (bytes > 0 and bytes <= 8388608),
  alt_text text not null check (length(trim(alt_text)) > 0),
  source_owner text not null check (length(trim(source_owner)) > 0),
  license_note text not null check (length(trim(license_note)) > 0),
  rights_confirmed boolean not null default false check (rights_confirmed),
  uploaded_at timestamptz not null default now()
);

create index if not exists cloudinary_media_assets_kind_uploaded_idx on public.cloudinary_media_assets (kind, uploaded_at desc);
