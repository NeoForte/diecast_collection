Pocket 64 v5.0.9 — Deterministic Restore

This revision removes the restore timing race.

IMPORTANT CHANGE
v5.0.9's restore handler owns the entire restore process from the moment the backup file is selected.
The normal app.js restore event is stopped, so there are no longer two restore paths competing with each other.

RESTORE ORDER
1. Read/validate backup
2. Warn if the garage is not empty
3. Restore car rows
4. Restore every embedded photo
5. Build old-car-ID -> restored-car-ID map
6. Build old-Set-ID -> restored-Set-ID map
7. Replace Sets exactly from backup
8. Restore exact Set assignments
9. Verify restored cars/Sets/assignments
10. Reload once
11. Let normal startup finish
12. Re-assert the exact backup Set state once
13. Show ONE final confirmation

SUCCESS MESSAGE
Restore complete ✓
[cars] · [photos] · [Sets] · [Set assignments]
Backup restored and verified.

RETAINED
- Help & FAQs
- Clear Collection / Danger Zone
- Set years collapsed by default
- Non-empty garage restore warning

TEST
1. Deploy and confirm Version 5.0.9.
2. Create a fresh backup from MAIN.
3. Clear DUMMY.
4. Restore the fresh MAIN backup into DUMMY.
5. Expect one automatic reload and then ONE final restore confirmation.
6. Check Sets contain cars.
7. Check Set icons appear on the correct collection cards.
8. Sign out/in once and verify persistence.
