Pocket 64 v5.2.3 — Settings App Update cleanup

WHAT CHANGED
- App Update, Version, and Refresh now sit on one compact line at the top of Settings.
- Removed the redundant Version badge from the About section.
- Keeps all v5.2.2 Set assignment fixes and Add to Set behavior.
- Cache-busted Pocket 64 to v5.2.3.

DEPLOY
Replace these files from this ZIP:
  index.html
  showcase-sync.js
  version.json

TEST FIRST
1. Open Settings and confirm the top row reads App Update / Version 5.2.3 / Refresh on one line.
2. Confirm the About section no longer has a Version badge.
3. Tap Refresh and confirm Pocket 64 returns showing Version 5.2.3.
4. Recheck Add to Set and Set Position behavior from v5.2.2.
