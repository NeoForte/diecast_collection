Pocket 64 v5.1.0 — Cloud-backed Sets in Backup

WHAT CHANGED

Backup now refreshes Sets and Set assignments directly from Supabase BEFORE the normal ZIP export begins.

WHY
The previous backup path used the browser's local Sets cache. If that local cache was stale or empty, a perfectly good account with cloud Sets could create a backup that reported 0 Sets.

v5.1.0 makes Supabase the source of truth for Sets at backup time.

FLOW
1. Tap Backup.
2. Pocket 64 reads the signed-in user's Sets from pocket64_sets.
3. Pocket 64 reads Set assignments from pocket64_set_assignments.
4. The authoritative cloud state is written into the app's local Sets state.
5. The normal self-contained ZIP backup runs.
6. backup.json therefore receives the cloud-backed Sets/assignments.

RETAINED
- v5.0.9 deterministic restore
- non-empty garage restore warning
- Help & FAQs
- Clear Collection / Danger Zone
- collapsed Set years

TEST
1. Deploy and confirm Version 5.1.0.
2. On MAIN, create a fresh full backup.
3. Restore that ZIP on a truly empty dummy account.
4. The restore confirmation should show the expected non-zero Set count.
5. After restore, Set pages should contain assigned cars and card Set icons should appear.
6. Then compare MAIN vs DUMMY in Supabase.
