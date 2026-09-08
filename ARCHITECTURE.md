# Pocket 64 Architecture

## Current production target
Pocket 64 is intentionally Safari-first. The old installable-PWA layer is being retired rather than expanded.

## Runtime source
- `index.html` — application shell and static UI.
- `app.js` — primary application behavior, Supabase auth/data/photo logic, collection/editor/stats/settings flows.
- `styles.css` — primary styling.
- `editor-core.js` — permanent Add/Edit editor rules, including Add Car cancel/reset, editor input behavior, and retired-field presentation.
- `camera-safety.js` — iPhone/Safari camera-stream protection only, retained until dormant live-camera code is removed from `app.js`.
- `viewer-core.js` — permanent Photos-like viewer sizing/gesture core. It no longer contains editor-reset or version-display compatibility code.
- `set-flow.js` and `set-ui.js` — current proven Set helpers; these are the only dedicated Set runtime helpers still loaded by the compatibility bootstrap.
- `showcase-sync.js` — legacy-named but still active compatibility/core services. It currently contains important backup/restore, appearance, account, Set, and Settings helpers. Do not remove wholesale until those responsibilities are migrated into permanent modules.
- `p64-v525-patch.js` — transitional load-order/PWA-retirement bootstrap only. Goal: eliminate this file after Set helper load order and legacy PWA retirement are fully consolidated.

## Removed compatibility layers
- `editor-viewer-core.js` was retired in v6.2.2 after editor and viewer ownership were separated.
- `photo-viewer.js` was retired in v6.2.3. Despite its filename, it contained obsolete v6.0.5 Set-picker/UI code and a stale version-display override, not required photo-viewer behavior.

## Backend
Supabase remains the data/auth/storage backend and is the continuity point for the future native iOS app.

Backend source kept in this repository:
- `supabase/functions/pocket64-support/index.ts`
- `supabase/migrations/20260902_support_requests.sql`

## Native iOS handoff direction
The future Swift/SwiftUI build should reuse the existing Supabase user IDs, car IDs, storage paths, Sets, and support backend rather than creating a second data model. Rebuild screens natively in this order: authentication, collection grid, Add/Edit, photos, Sets, Stats, Settings, Backup/Restore.

## Cleanup rule
If a file is not runtime-required, backend source, legal/license material, or current project documentation, it should not live at repository root. Historical release files remain recoverable through Git history and full-project rollback ZIPs rather than being carried forever in production source.
