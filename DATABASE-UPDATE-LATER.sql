-- Pocket 64 v3.0.1
-- Favorites + Multipacks + Retailer Exclusives

alter table public.cars
  add column if not exists is_favorite boolean not null default false,
  add column if not exists pack_size integer,
  add column if not exists exclusive_retailer text,
  add column if not exists exclusive_type text;

alter table public.catalog_cars
  add column if not exists exclusive_retailer text,
  add column if not exists exclusive_type text;

alter table public.cars
  drop constraint if exists cars_pack_size_check;

alter table public.cars
  add constraint cars_pack_size_check
  check (pack_size is null or pack_size between 2 and 999);

-- Safe catalog backfill where the existing series name itself identifies the exclusive.
update public.catalog_cars
set exclusive_retailer = 'Target', exclusive_type = 'Red Edition'
where upper(coalesce(series_collection,'')) = 'RED EDITION'
  and exclusive_retailer is null;

update public.catalog_cars
set exclusive_retailer = 'Kroger', exclusive_type = 'Store Recolor'
where upper(coalesce(series_collection,'')) like '%KROGER%EXCLUSIVE%'
  and exclusive_retailer is null;

-- Showcase selection
alter table public.cars add column if not exists is_showcase boolean not null default false;
