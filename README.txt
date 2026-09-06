Pocket 64 v5.2.2 — Set assignment polish

WHAT CHANGED
- Fixed the Add to Set / Set Position layout so both controls align cleanly in the two-column editor.
- When a user chooses or creates a Set, Pocket 64 now automatically fills Series / Collection with that Set name.
- Series / Collection remains editable afterward; the auto-fill only happens when the Set is selected.
- Keeps the v5.2.1 database-driven Add to Set flow, no-zoom fix, and App Update / Refresh control.
- Cache-busted Pocket 64 to v5.2.2.

DEPLOY
Replace these files from this ZIP:
  index.html
  showcase-sync.js
  version.json

TEST FIRST
1. Open Settings and confirm Version 5.2.2.
2. Edit a car and confirm ADD TO SET and Set Position line up cleanly.
3. Choose a known Set and confirm Series / Collection fills with the Set name immediately.
4. Confirm Set Position still offers the correct positions for the selected Set.
5. Change Series / Collection manually after choosing the Set and confirm your edit is allowed.
6. Save, reopen the car, and confirm the Set assignment and Series / Collection are preserved.
