Pocket 64 v5.0.6

Purpose: make backup restore reproduce the backup's Sets EXACTLY.

For the current test backup the correct result is:
- 13 Sets
- 44 Set assignments

v5.0.6 keeps the v5.0.5 Clear Collection and collapsed-Set-years fixes, plus:
- captures the exact remapped Sets state during restore,
- saves it to Supabase,
- reloads once,
- waits for normal startup/retro-link logic to finish,
- removes any extra Sets/assignments that startup added,
- writes the exact backup state back to Supabase and local storage,
- verifies the final cloud counts,
- re-renders the collection cards without another reload.

SUCCESS MESSAGE:
Restore verified ✓
13 Sets and 44 Set assignments restored exactly.

INSTALL:
Replace showcase-sync.js and version.json in GitHub, commit, wait for Cloudflare.

TEST:
1. Confirm Version 5.0.6.
2. Confirm Clear Collection exists.
3. Confirm Sets years start collapsed.
4. Clear the DUMMY account.
5. Restore the same 2026-09-04 backup.
6. Wait through the one automatic reload.
7. Look for the exact 13/44 verification message.
8. Check Sets and card icons, then sign out/in once.
