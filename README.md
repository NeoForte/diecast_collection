# Pocket 64

Pocket 64 is a private, Safari-first diecast collection tracker.

## Current source layout
- `index.html` — application shell and editor markup
- `app.js` — core application behavior
- `styles.css` — primary styling
- `set-core.js` / `set-visuals.js` — Sets behavior and presentation
- `editor-core.js` — editor behavior
- `viewer-core.js` — known-good Safari photo-viewer behavior; keep as an active dependency
- `camera-safety.js` — Safari camera/media safety behavior
- `showcase-sync.js` — support/backup UI integration
- `version.json` — single release-version source used by packaging
- `CHANGELOG.md` — continuous release history
- `ARCHITECTURE.md` — developer architecture and cleanup notes
- `.github/workflows/package-release.yml` — reusable full-project packaging workflow

## Deployment
Pocket 64 is deployed as a static site through GitHub and Cloudflare Pages. Safari on iPhone is the reference browser during current development.

## Release policy
Normal features and fixes should be implemented directly in permanent source. Temporary patch files should only be used when there is a specific migration or compatibility need, and should be removed once that need has passed.

## Backup safety
Keep a verified Pocket 64 backup before major changes. Full-project release ZIPs are rollback packages for the source tree; collection-data backups are handled by the app itself.

For historical changes, see `CHANGELOG.md`.

## v6.4.13 upload

This ZIP contains the full project. Upload its contents into the existing repository, replacing matching files. Keep `supabase/functions/pocket64-support/index.ts` and `supabase/migrations/20260902_support_requests.sql` in their existing folders. The duplicated root `index*.ts` and `20260902_support_requests*.sql` copies are omitted; remove those root copies from an existing checkout if they are still present. No new database migration or support-function deployment is required for these UI changes.
