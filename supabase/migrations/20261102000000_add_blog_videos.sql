-- Public bucket for videos uploaded from the blog editor. The browser uploads with a signed URL
-- created on the server (lib/blog.ts), so there are still no public write policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-videos', 'blog-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
