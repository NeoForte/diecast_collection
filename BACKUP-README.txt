Pocket 64 v6.4.13 — Clear Collection fix + Support email
Source commit: 0228f27d7cf55bb665d0c70587720c577f27810f

This is the current full-project backup.
Includes the deployed support function with working Resend notifications.
App version is 6.4.13. Clear Collection event wiring is fixed in this build.

Restoring the website files alone does not redeploy the Supabase function.
If restoring the backend, deploy supabase/functions/pocket64-support/index.ts
as pocket64-support in the existing project, preserving verify_jwt=false for
the sign-in Help form. Keep RESEND_API_KEY in Supabase Edge Function Secrets.
The secret value is deliberately NOT included in this ZIP.

Notifications: support@pocket64.app -> pocket64app@gmail.com.
Reply-To: the email submitted by the person requesting help.
Tickets remain saved even when email sending fails. Transient email errors
receive one immediate retry; there is no scheduled retry queue.

This is a source-code backup. Use the app's Backup & Restore separately
for your cars, photos, Sets, and assignments. Existing database contents
and hosted account configuration are not exported in this ZIP.

The included package-release workflow is a packaging helper from the prior
full-project ZIP; it was not installed as a new workflow on the live repo.
