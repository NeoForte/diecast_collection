Pocket 64 v5.0.5

Fixes a packaging regression in v5.0.4:
- Restores Settings > Danger Zone > Clear Collection.
- Restores the Sets default-collapsed behavior so 2026 does NOT auto-expand.
- Keeps the v5.0.4 Sets restore/verification fix intact.
- Visible version: 5.0.5.

Why this happened:
v5.0.4 still called the Clear Collection / collapse helpers, but those helper definitions were accidentally omitted from the packaged showcase-sync.js. That caused the sidecar script to stop when it reached those missing functions.

Install:
Replace showcase-sync.js and version.json in GitHub, commit, and wait for Cloudflare deploy.

Before doing another full restore:
1. Confirm Settings shows Version 5.0.5.
2. Confirm Danger Zone / Clear Collection is visible.
3. Open Sets and confirm ALL years are collapsed.
4. Only then Clear Collection on the dummy account and rerun the backup restore.
