-- A return trip paid alongside its outbound leg in one combined Stripe Checkout session (see
-- startBookingCheckout in lib/actions.ts) now writes that same stripe_checkout_session_id to
-- both linked bookings, so the one-session-per-booking uniqueness from the initial schema no
-- longer holds — drop it, or every combined-payment confirmation fails with a duplicate key
-- error on the second booking.
alter table public.bookings drop constraint if exists bookings_stripe_checkout_session_id_key;
-- Still useful to look bookings up by session id (e.g. from a future Stripe webhook), just not
-- unique anymore.
create index if not exists bookings_stripe_checkout_session_id_idx on public.bookings (stripe_checkout_session_id);
