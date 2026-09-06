Pocket 64 v5.2.1 — Add to Set database flow + update refresh

WHAT CHANGED
- ADD TO SET now goes directly to one clean Set picker.
- Release Year is now a dropdown populated from every year that has known Set reference data in Pocket 64.
- Selecting a year loads the known Set names for that year into the Set Name dropdown.
- Selecting a known Set automatically fills Cars in Set from the reference data.
- Manual / Other remains available for Sets that are not yet in the reference data.
- Completely removed the separate EXISTING button from Add to Set. Existing personal Sets are reused automatically when the chosen year/name already exists.
- Fixed the mobile zoom-in behavior when opening Add to Set by keeping modal controls at iPhone-safe font sizing and removing forced focus.
- Added an App Update / Refresh control at the top of Settings. It checks the visible version, asks the service worker to update, and reloads the app shell so PWA updates are easier to verify.
- Cache-busted Pocket 64 to v5.2.1.

DEPLOY
Replace these files from this ZIP:
  index.html
  showcase-sync.js
  version.json

TEST FIRST
1. Open Settings and confirm App Update appears at the top and shows Version 5.2.1.
2. Tap Refresh and confirm Pocket 64 reloads and still shows Version 5.2.1.
3. Add/Edit a car and tap ADD TO SET. Confirm the app does not zoom in.
4. Confirm Release Year is a dropdown containing the years with known Set data.
5. Pick a year and confirm Set Name becomes a dropdown of known Sets for that year.
6. Pick a known Set and confirm Cars in Set fills automatically.
7. Create/choose a Set that already exists personally and confirm Pocket 64 reuses it instead of creating a duplicate.
8. Confirm there is no separate EXISTING button.
9. Test MANUAL / OTHER for a Set not in the reference list.
