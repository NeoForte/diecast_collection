Pocket 64 v4.2.3 — Version Race Fix

WHAT THIS FIXES
- Settings could briefly show 4.2.3, then flip back to 4.2.2.
- Cause: index.html showed 4.2.3 first, then app.js overwrote it using its old APP_VERSION value.
- This build replaces the APP_VERSION value in served app.js using a robust regex rather than an exact text match.
- Also replaces any remaining literal "Version 4.2.2" strings in served app.js.
- Set edit and the clean single ••• menu are unchanged.

INSTALL
Replace sw.js with this one.
Fully close Pocket 64 and reopen it.
Refresh Settings once.
The version should remain 4.2.3 instead of flashing back to 4.2.2.
