alter table public.bookings
  add column if not exists payment_method text not null default 'card' check (payment_method in ('card', 'cash'));
