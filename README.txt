Pocket 64 v5.0.3

Changes:
1. Restores the Settings > Danger Zone > Clear Collection control.
   - Uses Pocket 64's existing protected clear function.
   - Requires the existing confirmation and typing CLEAR.
   - Clears the currently signed-in account only.
   - Cars, saved car photos, Sets, and Set assignments are removed.

2. Sets page now opens with ALL years collapsed.
   - 2026 no longer auto-expands.
   - You can still tap any year to expand/collapse it normally.

3. Includes the v5.0.2 Sets restore cloud fix.

4. version.json is now 5.0.3.

Install:
Replace showcase-sync.js and version.json in the repository with these files,
commit, then wait for Cloudflare Pages to deploy.

Test order on the DUMMY account:
- Confirm Settings shows Version 5.0.3.
- Confirm Danger Zone / Clear Collection appears.
- Open Sets: no year should be expanded initially.
- Use Clear Collection on the dummy account.
- Restore your backup again.
- Verify cars, all photos, Sets, Set assignments, and card Set icons.
- Refresh/sign out/sign in and verify everything persists.
