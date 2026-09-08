# Pocket 64 Architecture

## Current production target
Pocket 64 is intentionally Safari-first. The old installable-PWA layer is being retired rather than expanded.

## Runtime source
- `index.html` — application shell and static UI.
- `app.js` — primary application behavior, Supabase auth/data/photo logic, collection/editor/stats/settings flows.
- `styles.css` — primary styling.
- `showcase-sync.js` — legacy-named but still active compatibility/core services. It currently contains important backup/restore, appearance, account, Set, and Settings helpers. Do not remove wholesale until those responsibilities are migrated into permanent modules.
- `p64-v525-core.js` — proven Add Car cancel-reset and photo-viewer behavior retained from the stable build.
- `p64-v531-viewer.js`, `p64-v538-set-flow.js`, `p64-v609-set-ui.js` — proven photo/Set helpers still required by the current web build.
- `p64-v612-camera-guard.js` — protects iPhone Safari from dormant legacy streaming-camera code until that code is removed from `app.js`.
- `p64-v525-patch.js` — temporary compatibility bootstrap only. Goal: eliminate this file after helper load order and legacy camera code are permanently consolidated.

## Backend
Supabase remains the data/auth/storage backend and is a good continuity point for the future native iOS app.

Backend source kept in this repository:
- `supabase/functions/pocket64-support/index.ts`
- `supabase/migrations/20260902_support_requests.sql`

## Native iOS handoff direction
The future Swift/SwiftUI build should reuse the existing Supabase user IDs, car IDs, storage paths, Sets, and support backend rather than creating a second data model. Rebuild screens natively in this order: authentication, collection grid, Add/Edit, photos, Sets, Stats, Settings, Backup/Restore.

## Cleanup rule
If a file is not runtime-required, backend source, legal/license material, or current project documentation, it should not live at repository root. Historical release files remain recoverable through Git history and full-project rollback ZIPs rather than being carried forever in production source.
