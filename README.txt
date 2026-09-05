Pocket 64 v5.1.1 — Authoritative Cloud Backup

THIS IS THE IMPORTANT BACKUP FIX.

The Backup button is now fully owned by the v5.1.1 backup handler.
The old app.js backup handler does not run.

WHY
v5.1.0 fetched Sets from Supabase, wrote them to localStorage, then handed control back to the old exporter.
Safari could still leave the exporter reading stale/empty Set state.

v5.1.1 removes that handoff completely.

BACKUP SOURCE OF TRUTH
The ZIP is built directly from Supabase:
- cars table
- pocket64_sets
- pocket64_set_assignments
- private car-photos storage

The backup does NOT depend on the browser's local Sets cache.

HARD SAFETY CHECKS
Before a ZIP is downloadable:
- every Set assignment must point to a car in the account
- every Set assignment must point to an existing Set
- packed Set count must equal Supabase Set count
- packed assignment count must equal Supabase assignment count
- if cloud Sets exist, a 0-Set ZIP is refused

SUCCESS MESSAGE
Backup complete ✓
[cars] · [photos] · [Sets] · [Set assignments]
Backup built from Supabase cloud data and verified.

TEST
1. Deploy and confirm Version 5.1.1.
2. On MAIN, tap Backup.
3. The backup success popup itself should report the expected cloud counts.
4. On an empty dummy, choose Restore.
5. BEFORE pressing OK, the restore preview should show the same non-zero Set count.
6. If the preview says 0 Sets, CANCEL and do not restore.
7. If counts are correct, restore and then verify Set cars/icons.
