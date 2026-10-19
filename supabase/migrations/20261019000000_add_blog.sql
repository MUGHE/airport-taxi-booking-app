-- Blog CMS: categories, posts, and a public bucket for images uploaded from the admin editor.
-- Reads and writes go through the server with the service role key, like the rest of the
-- site, so the tables enable RLS with no public policies.

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  excerpt text not null default '' check (char_length(excerpt) <= 320),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  featured_image_url text,
  featured_image_alt text not null default '',
  category_id uuid references public.blog_categories (id) on delete set null,
  author_id uuid references public.admin_users (id) on delete set null,
  author_name text not null default '',
  seo_title text not null default '' check (char_length(seo_title) <= 70),
  seo_description text not null default '' check (char_length(seo_description) <= 170),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_published_has_date check (status = 'draft' or published_at is not null)
);

create index if not exists blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx on public.blog_posts (category_id);

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

create or replace function public.touch_blog_post_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at before update on public.blog_posts
  for each row execute function public.touch_blog_post_updated_at();

-- Public read so <img> tags work; uploads only happen server-side with the service role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
