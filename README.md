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


## v14
- Main collection photos now use a portrait 3:4 frame.
- Photos use contain instead of cover so the complete image is visible without cropping.
- Editor photo preview also shows the complete image.


## v15
- Added minus and plus buttons around Quantity for quick one-tap adjustments.
- Quantity remains manually editable and is normalized to a minimum of 1 when entered.
- Removed NIB / Loose from the app interface and collection display without deleting historical database values.
- Added manual General Number field.
- Added manual Series / Collection Number field.
- New number fields save to Supabase and are included in collection search and backups.
- Bumped the PWA cache to v15 so devices load the updated interface.


## v16 disaster-recovery backup
- Export Backup now creates one dated ZIP containing `backup.json` plus every private car photo.
- Backup export verifies that every expected stored photo was downloaded before producing the ZIP, so an incomplete image backup is not silently treated as complete.
- Added Restore Backup for v16 ZIP backups. Restore rebuilds collection records and uploads the embedded images back to private Supabase Storage.
- Restore is non-destructive: it merges/updates backed-up records and does not delete unrelated cars already in the garage.
- Backups from a different account are restored with new car IDs so they do not conflict with records owned by another account.
- Legacy JSON backups from v3-v15 can still restore car data, but those older backups cannot restore image files because they never contained the images.
- Bundled JSZip 3.10.1 locally so backup/restore does not depend on an extra CDN request.
- Bumped the PWA cache to v16.


## v17
- Renamed Special / Rarity to Special Category.
- Added Silver Series, Car Culture Premium, Elite 64, and Red Line Club.
- STH cards use a gold border.
- Silver Series cards use a silver border.
- Car Culture Premium cards use a graphite border.
- Elite 64 cards use a gunmetal-blue border.
- Red Line Club cards use a metallic red border.
- Existing TH / Chase / Rare styling is unchanged.


## v18
- Added minus and plus quantity controls directly to every collection card.
- Card quantity changes auto-save immediately to Supabase; minimum quantity remains 1.
- Added model type-ahead suggestions from cars already in the collection; matches narrow as more text is entered.
- Existing duplicate-model warning remains in place.
- Bumped PWA cache and asset versions to v18.


## v19
- Replaced Scale in the app UI with Color (common dropdown values + custom typed color).
- Added optional Hot Wheels Toy Number field, searchable in Collection search.
- Added None and custom typed-brand support to Diecast Brand.
- Removed Other Special label; Special Category now supports a custom typed value.
- Brand Stats rows are clickable and filter the Collection to that brand.
- Model/duplicate suggestions now include the existing car photo thumbnail when available.
- Existing Scale database values are preserved but no longer shown/edited.


## v20
- Added a small Custom checkbox next to Diecast Brand.
- Custom cars save a dedicated database flag and receive a CUSTOM badge.
- Cards can display multiple badges simultaneously.
- Renamed Hot Wheels Toy Number to Toy Number.
- Split Car Culture Premium into separate Premium and Car Culture Special Category options.
- Custom cars use a unique iridescent multi-layer border/glow so they stand out independently of STH/RLC/etc.


## v21
- Made collection cards more compact with a near-square photo area.
- Reduced card text, badge, and +/- quantity-control sizing.
- Normalized editor input/select heights so Color and Series match the rest of the form.


## v22
- Hotfix for v21 layout changes not appearing.
- Updated all cache-busting asset versions so the compact-card CSS loads correctly.


## v23
- Fixed Custom checkbox/text overflow on narrow screens.
- Cleaned up Color and Series field vertical alignment.
- Switched collection cards to 3-wide on mobile and 4-wide on wider screens.
- Further reduced card text, badges, spacing, and +/- controls for the denser grid.


## v24
- Toy Number automatically converts to uppercase while typing.
- Toy Number is also forced to uppercase when saved.


## v25
- Fixed collection cards so the +/- quantity controls anchor consistently at the bottom.
- Replaced the app icon with a custom white/silver metallic Porsche 911-style icon.


## v26
- Updated backup format to version 4.
- Restore now includes Color, Toy Number, and Custom status.
- Backup/restore remains compatible with older fields and embedded photos.
- Current schema fields are preserved during same-account or throwaway-account restore testing.
