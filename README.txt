Pocket 64 v5.2.0 — Set workflow cleanup

WHAT CHANGED
- Simplified Add to Set on the Add/Edit Car screen.
- Tapping ADD TO SET now opens the manual New Set form immediately.
- Removed the extra + NEW SET step from the visible editor flow.
- Removed the year-specific 2025/2026 reference-list step from New Set creation in the editor.
- Existing Sets are still available behind a small EXISTING button when needed, instead of filling the editor with options.
- Existing automatic matching can still select a matching personal Set behind the scenes.
- Restore confirmation now shows Set assignment count as well as cars, photos, and Sets.
- Removed the obsolete Help/FAQ question “What is Showcase?”
- Cache-busted app.js and showcase-sync.js to v5.2.0.

DEPLOY
Replace these files from this ZIP:
  index.html
  showcase-sync.js
  version.json

TEST FIRST
1. Confirm Settings shows Version 5.2.0.
2. Add/Edit a car and tap ADD TO SET. The New Set form should open immediately with Year, Set Name, and Cars in Set.
3. Create a Set and verify it becomes selected for the car; choose a Set Position if desired, then Save.
4. Use EXISTING and verify a previously created Set can still be selected.
5. Edit a car whose Series/Collection matches an existing personal Set and verify automatic matching still works.
6. Open Help & FAQs and confirm “What is Showcase?” is gone.
7. Start a Restore and confirm the preview includes Set assignments.
