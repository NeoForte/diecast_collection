-- Pocket 64 v2.9.0
-- Run this later in Supabase SQL Editor when you are ready to activate Favorites + Multipacks.

alter table public.cars
  add column if not exists is_favorite boolean not null default false,
  add column if not exists pack_size integer;

alter table public.cars
  drop constraint if exists cars_pack_size_check;

alter table public.cars
  add constraint cars_pack_size_check
  check (pack_size is null or pack_size between 2 and 999);
