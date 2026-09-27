-- Payout receipts are JPG/JPEG only, at most 200 KB (enforced in lib/store.ts too).
update storage.buckets
set file_size_limit = 204800, allowed_mime_types = array['image/jpeg']
where id = 'referral-receipts';
