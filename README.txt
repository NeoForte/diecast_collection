Pocket 64 v5.0.4 — Restore Sets Fix

Confirmed backup used for diagnosis:
- 207 cars
- 226 photos
- 13 Sets
- 44 Set assignments

WHAT v5.0.4 CHANGES
- Keeps the successful car/photo restore untouched.
- Captures the exact Sets state at the moment Pocket 64 remaps old car IDs to the newly restored car IDs.
- For a different account, generates new Set IDs so they cannot collide with the source account.
- Writes the restored Sets and car-to-Set assignments to Supabase.
- Verifies the exact cloud counts before calling the Sets portion successful.
- Reloads once after verification so Sets and card Set icons hydrate from the verified cloud data.
- Shows a confirmation after reload with the restored Set/assignment counts.
- Retains v5.0.3 Clear Collection and all-years-collapsed behavior.
- Visible version is 5.0.4.

INSTALL
Replace these two files in the repository:
  showcase-sync.js
  version.json

Then commit and wait for Cloudflare Pages to deploy.

CLEAN DUMMY TEST
1. Confirm Settings shows Version 5.0.4.
2. Settings > Danger Zone > Clear Collection.
3. Restore Pocket64_Backup_2026-09-04.zip.
4. The app may reload once automatically near the end.
5. You should get:
   Restore verified ✓
   13 Sets and 44 Set assignments restored and saved.
6. Check Sets page.
7. Check Set icons on collection cards.
8. Refresh, sign out, and sign back in. Sets and icons should remain.

If v5.0.4 cannot verify the cloud counts, it will explicitly say the Sets portion failed instead of silently reporting a successful full restore.
