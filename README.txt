Pocket 64 v5.1.2 — Cache-busted backup fix

WHY 5.1.1 STILL EXPORTED 0 SETS
The visible version comes from version.json, but index.html was still loading:
  app.js?v=5.0.0
  showcase-sync.js?v=5.0.0

That allowed Safari/PWA caching to keep running an older showcase-sync.js even while Settings showed Version 5.1.1.

The uploaded 5.1.1 backup proved this: it was old backup format v7 and contained 0 Sets.

WHAT 5.1.2 CHANGES
- index.html now loads showcase-sync.js?v=5.1.2
- showcase-sync.js loads BEFORE app.js
- app.js URL is also cache-busted to ?v=5.1.2
- the owned Backup and Restore event interceptors install immediately
- the v5.1.1 authoritative Supabase-backed exporter is retained

EXPECTED BACKUP
MAIN currently has 209 cars / 23 Sets / 60 Set assignments.
A fresh 5.1.2 backup should report those non-zero Set counts in its success popup.

TEST
1. Replace ALL THREE files from this ZIP:
   index.html
   showcase-sync.js
   version.json
2. Commit/deploy.
3. Confirm Version 5.1.2.
4. Make a NEW backup from MAIN.
5. The backup success popup should include Sets and Set assignments.
6. On an empty dummy, choose that NEW ZIP for Restore.
7. The restore preview must show a non-zero Set count. If it says 0, CANCEL.
