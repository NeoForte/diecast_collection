Pocket 64 v5.0.8 — Restore Preflight + One Final Result

WHAT CHANGED

1. NON-EMPTY GARAGE WARNING
If Restore is started while the signed-in garage already contains cars, Pocket 64 warns:
- a clean restore should start with Clear Collection
- continuing may create duplicates / mixed data
- Cancel is available before anything is restored

2. FIXES THE SETS RESTORE RACE
Previous versions inspected the backup asynchronously while app.js could start restoring immediately.
That timing race explains why some restores ended with 0 Sets / 0 assignments and no Set icons.

v5.0.8 now stops the restore event first, fully reads the backup metadata, then releases the normal restore process.
That means the Sets metadata is already captured before car IDs begin remapping.

3. ONE RESTORE COMPLETION MESSAGE
The normal mid-restore "cars/photos processed" popup is suppressed.
After the Sets state is written and verified, Pocket 64 shows one final result containing:
- cars
- photos processed
- Sets
- Set assignments

Example:
Restore complete ✓
209 cars · 235 photos processed · 23 Sets · 60 Set assignments
Backup restored and verified.

4. FINAL VERIFICATION
Before the final success message, v5.0.8 verifies:
- restored car row count
- exact Set count
- exact Set-assignment count
Photos are reported from the completed native photo-processing stage.

5. FAQ
Adds a FAQ explaining why restoring into a non-empty garage is not recommended.

RETAINED
- Help & FAQs page from 5.0.7
- Clear Collection / Danger Zone
- Sets years collapsed by default
- exact Set-state enforcement from 5.0.6

TEST
1. Deploy and confirm Version 5.0.8.
2. On a garage with cars, tap Restore and confirm the warning appears; Cancel should stop it.
3. Clear the dummy garage.
4. Make a fresh backup from MAIN.
5. Restore that fresh backup to DUMMY.
6. There should be ONE final restore popup, not a car popup followed by a Sets popup.
7. Confirm Sets contain cars and Set icons appear on collection cards.
8. Sign out/in once and confirm they persist.
