# Pocket 64 Architecture

## Current production target
Pocket 64 is intentionally Safari-first. The old installable-PWA layer is being retired rather than expanded.

## Runtime source
- `index.html` — application shell and static UI.
- `app.js` — primary application behavior, Supabase auth/data/photo logic, collection/editor/stats/settings flows.
- `styles.css` — primary styling.
- `editor-core.js` — permanent Add/Edit editor rules, including Add Car cancel/reset, editor input behavior, and retired-field presentation.
- `camera-safety.js` — iPhone/Safari camera-stream protection only, retained until dormant live-camera code is removed from `app.js`.
- Photo viewer sizing and gesture behavior are now owned directly by `styles.css` + `app.js` (v6.2.10); the transitional `viewer-core.js` layer is retired.
- `set-core.js` — permanent Set editor/create/picker module. v6.2.6 merged the former `set-flow.js` + `set-ui.js` helpers and removed their version-stamped DOM scaffolding.
- `showcase-sync.js` — legacy-named but still active support/core services. It contains authoritative backup/restore plus account, Set-editor, FAQ, and Settings helpers. v6.2.8 removed its global delayed re-patch loop and main-view MutationObserver; initialization is now one-time and feature-specific observers remain only where DOM content genuinely changes.

## Removed compatibility layers
- `p64-v525-patch.js` was retired in v6.2.7. Permanent helper modules now load directly from `index.html`, and its final Safari/PWA-retirement behavior lives in `app.js`.
- `set-flow.js` and `set-ui.js` were retired in v6.2.6 after their required behavior was consolidated into `set-core.js`.
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
