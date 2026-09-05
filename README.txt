Pocket 64 v5.0.2 — Sets Restore Fix

WHAT THIS IS
This ZIP contains one replacement file:
  showcase-sync.js

WHAT IT FIXES
During a backup restore, cars and photos were restoring correctly, but Sets and Set assignments
were only being rebuilt in browser-local state and were not reliably persisted to Supabase.
On a new account, the cloud sync could then replace that local Sets state with an empty cloud state.

This patch watches a restore, waits until Pocket 64 has remapped the restored car IDs, then:
- restores the Sets to Supabase,
- restores each car-to-Set assignment,
- creates new Set IDs when the backup is restored into a different account,
- preserves Set IDs on a same-account restore,
- keeps the local Sets state in sync with the cloud copy.

HOW TO USE
1. Unzip this package.
2. In your Pocket 64 GitHub repository, replace the existing showcase-sync.js with the one in this ZIP.
3. Commit the change.
4. Wait for Cloudflare Pages to finish deploying.
5. Use the EMPTY dummy account for the clean retest.
6. Clear the dummy collection first, then restore the same backup ZIP again.
7. Check:
   - Set names exist
   - cars appear inside the Sets
   - Set badges/icons appear on collection cards
   - refresh/sign-out/sign-in and verify the Sets remain

IMPORTANT
Do not test by repeatedly restoring the same cross-account backup into a populated dummy account.
Use Clear Collection first so the car restore remains a clean test.

This is intentionally a narrow patch for the failed Sets restore test.


VERSION
This patch is Pocket 64 v5.0.2.
Going forward, each app change should increment the visible version sequentially (5.0.3, 5.0.4, etc.).
