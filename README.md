# AJ's Garage

Private personal PWA for cataloging diecast cars.

## Features in v1
- Email/password sign-in with Supabase Auth
- Private collection database with RLS
- Add, edit, delete cars
- Optional fields only
- Private photo storage
- Automatic photo compression before upload
- Search
- Installable PWA for iPhone Home Screen

## Deploy on Cloudflare Pages
1. Create a GitHub repository and upload all files in this folder.
2. In Cloudflare Dashboard, go to Workers & Pages > Create > Pages > Connect to Git.
3. Select the GitHub repository.
4. Framework preset: None.
5. Build command: leave blank.
6. Build output directory: `/` (repository root).
7. Deploy.
8. Copy the final `https://...pages.dev` URL.
9. In Supabase Dashboard > Authentication > URL Configuration, set Site URL to that Cloudflare URL and add it as a Redirect URL.
10. Open the site, create your account, confirm the email, and sign in.

## iPhone install
Open the deployed URL in Safari, Share > Add to Home Screen, then enable Open as Web App if shown.


## v2 fix
- Fixed a Supabase auth-state deadlock that could make Save appear to do nothing.
- Confirmation emails now explicitly redirect to the GitHub Pages app URL.
- Save button now shows Saving… while a save is in progress.


## v3 backup
- Added one-click Export Backup.
- Backup downloads a dated JSON file with all car records and private photo paths.
- Photo image files remain stored privately in Supabase and are not embedded in the JSON backup.


## v4 fix
- Force-loads the newest app JavaScript to prevent a stale cached file from leaving Export Backup unwired.
- Export Backup now uses the already-loaded collection data and gives visible feedback/errors.

## v5 AJ's Garage update
- Renamed the app to AJ's Garage.
- Switched all app pages to a black/dark theme.
- Added a Stats page with diecast-brand counters.
- Brand field now offers Hot Wheels, Matchbox, M2, Cartuned, Maisto, Mini GT, Majorette, and Other while still allowing typed custom brands.
- Model Year now offers 2028 down to 2000 while still allowing any typed year.
- Removed Make from the app UI without deleting existing Make data from the database.
- Added optional NIB / Loose status.
- iPhone photo picker now allows camera or Photo Library selection.


## v6
- Brand is now a true dropdown with a visible Other option and custom brand field.
- Model Year is now a true dropdown from 2028 down to 2000, plus Other with a custom year field.
- Existing custom brands and out-of-range years automatically open in the custom fields when editing.


## v7
- Main collection cards now show a top-right quantity number only when quantity is greater than 1.
- Added a subtle black brick-wall background throughout the app.
- Added Special / Rarity options: TH, STH, Chase, Rare, Limited / Special Edition, and Other Special.
- Special cars are visually highlighted on the collection page with a status badge and accent border.
- Search now includes special / rarity status.


## v8 update
- Added Quick Add bulk-entry mode.
- Quick Add keeps the previous diecast brand after Save & Next.
- Quick Add shows Photo, Brand, Model, Quantity, and Special/Rarity first.
- Model Year, Scale, Series/Collection, NIB/Loose, and Notes are available under More Details.
- Fixed quantity and special badges so they remain visible over saved photos.
- Updated PWA cache to v8.


## v9
- Quick Add moved into the compact top navigation.
- Stats now separate Unique Cars from Grand Total (quantity).
- Sign out now requires confirmation.


## v10
- Model-only duplicate detection on Add and Quick Add.
- Exact model matches are flagged before saving.
- A single exact match can be incremented directly with Increase Qty; Add Anyway dismisses the warning.


## v11
- Added main-page collection sorting.
- Sort options: newest, oldest, brand A–Z/Z–A, model A–Z/Z–A, quantity high/low, and special-first.
- Selected sort is remembered on the device.


## v12 hotfix
- Fixed v11 startup initialization issue that could prevent sign-in.
- Retains all v11 sorting features.


## v13
- Built directly from the stable v12 hotfix.
- Preserves Quick Add, duplicate detection, sorting, quantity badges, special/rarity highlighting, stats, backup, and all prior features.
- Refined the black brick-wall background with smaller bricks and a very subtle repeating AJ monogram.
- Bumped the PWA cache to v13 to prevent stale assets from masking the update.
