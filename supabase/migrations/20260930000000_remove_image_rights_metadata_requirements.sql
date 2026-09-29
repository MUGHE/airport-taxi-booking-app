alter table public.cloudinary_media_assets
  drop constraint if exists cloudinary_media_assets_source_owner_check,
  drop constraint if exists cloudinary_media_assets_license_note_check,
  drop constraint if exists cloudinary_media_assets_rights_confirmed_check;

alter table public.cloudinary_media_assets
  alter column source_owner set default '',
  alter column license_note set default '',
  alter column rights_confirmed set default false;
