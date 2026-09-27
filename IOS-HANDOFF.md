# Pocket 64 Native iOS Handoff

Pocket 64 web v6.4.14 remains the production baseline. The native iOS app should reuse the same Supabase project and data model instead of creating parallel user or collection records.

## Supabase
- Project ref: `ftjayqjpgifdipmjloxx`
- Client auth: Supabase email/password with verified-email flow
- Public client key: use the project's publishable key; never embed a service-role key
- Existing user UUIDs remain authoritative across web and native

## Core tables
### `public.cars`
Primary collection record. Ownership is `user_id = auth.uid()`.
Important fields include:
- `id`, `user_id`
- `diecast_brand`, `make`, `model`, `model_year`, `scale`
- `series_collection`, `general_number`, `series_collection_number`
- `color`, `hotwheels_toy_number`, `category`
- `package_status`, `special_status`, `is_custom`
- `is_favorite`, `is_showcase`
- `pack_size`, `exclusive_retailer`, `exclusive_type`
- `quantity`, `notes`
- `photo_path`, `photo2_path`, `photo3_path`
- `created_at`, `updated_at`

### `public.catalog_cars`
Authenticated read-only catalog/reference data.

### `public.pocket64_sets`
User-owned Sets. Keep the existing UUIDs, year/name/total fields, and unique user/year/name behavior.

### `public.pocket64_set_assignments`
Links a user's car to a user's Set and position. A car may belong to only one Set for that user under the current unique constraint.

### `public.support_requests`
Private support-ticket storage. Direct client access is intentionally blocked; submit through the `pocket64-support` Edge Function.

## Storage
### `car-photos`
Private bucket. Native uploads must continue using a first path segment equal to the signed-in user UUID.

Current car-photo naming is compatible with native. Do not migrate or rename existing objects just for iOS.

## Edge Functions
- `pocket64-support` is the active support endpoint.
- Historical catalog-import functions are not part of the native runtime path.

## Native build order
1. Authentication/session restore
2. Collection grid + car detail
3. Add/Edit car
4. Photo upload/display/delete
5. Sets + assignments
6. Favorites/Showcase + Stats
7. Settings + Help/Support
8. Backup/Restore strategy for native

## Compatibility rules
- Never create a second user profile identity when Supabase Auth already supplies the user UUID.
- All collection queries must be scoped by the authenticated user and rely on server-side RLS as the enforcement layer.
- Preserve existing car UUIDs and storage paths.
- Treat `updated_at` as the conflict/concurrency timestamp when editing an existing car.
- Keep the web app stable while native work proceeds in a separate iOS repository.
