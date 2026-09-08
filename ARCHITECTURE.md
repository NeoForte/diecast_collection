# Pocket 64 Architecture

## Current production target
Pocket 64 is intentionally Safari-first. The old installable-PWA layer is being retired rather than expanded.

## Runtime source
- `index.html` — application shell and static UI.
- `app.js` — primary application behavior, Supabase auth/data/photo logic, collection/editor/stats/settings flows.
- `styles.css` — primary styling.
- `editor-core.js` — permanent Add/Edit editor rules, including Add Car cancel/reset and editor input behavior. Retired compatibility fields are now hidden directly in `index.html` rather than patched at runtime.
- `camera-safety.js` — iPhone/Safari camera-stream protection only, retained until dormant live-camera code is removed from `app.js`.
- `viewer-core.js` — active, known-good iPhone/Safari photo-viewer sizing and gesture compatibility. A v6.2.9 attempt to retire it caused initial over-zoom and broken pinch/pan; v6.2.10 restored it. Do not remove or refactor without dedicated gesture regression testing.
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

## CSS cleanup status (v6.3.3)
`styles.css` was inventoried in v6.3.1. v6.3.2 began the surgical cleanup phase with the main header/banner chain only. Five exact historical duplicate alignment rules were removed from the v2.4.7 section while identical later declarations remain in v2.5.2/v2.6.x, preserving the final cascade. No banner sizing/positioning or other visual behavior was intentionally changed.

Retired `p64-v525-patch.js`, `set-flow.js`, and `set-ui.js` remain absent from the physical project snapshot. `viewer-core.js` remains an active known-good dependency and is not a cleanup target.


## CSS audit snapshot
The v6.3.1 audit found 5,710 lines, about 1,237 simple rule blocks, 176 repeated selector strings, and 8 exact repeated selector/declaration groups. The densest historical override area is `.brand-header .brand-banner`. Repetition alone is not considered safe to delete because later-wins cascade behavior and media queries can make apparently duplicate rules functional. CSS cleanup should continue one visual area at a time with Safari comparison before and after.
