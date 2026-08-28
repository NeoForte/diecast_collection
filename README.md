Pocket 64 v3.0.5

Changes: Favorite control removed from Add/Edit Car. Favorite is now a hollow star on the top-right of each collection card; tapping toggles a metallic-blue filled star. Quantity photo badge moved to bottom-right.

# Pocket 64

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


## v28
- Prevented redundant full collection reloads when Supabase refreshes the auth session after returning from another app.
- Added true viewport-based lazy loading for collection photos using IntersectionObserver.
- Added native image lazy-loading/async decoding as a fallback optimization.
- Added an in-memory signed photo URL cache to avoid repeatedly requesting the same private photo URL during a session.
- Preserved the v27 in-place +/- quantity update behavior so quantity changes do not rebuild the grid.
- Bumped the PWA cache and all asset versions to v28.


## v29
- Cleaned up the Add/Edit Car entry form spacing, label placement, and control sizing.
- Moved the word Custom above its checkbox and gave the checkbox its own aligned control box.
- Normalized input heights, label typography, quantity controls, and responsive spacing.
- Preserved all v28 lazy-loading and return-from-background refresh fixes.
- Bumped the PWA cache and asset versions to v29.


## v30 Pocket 64 update
- Renamed the app and installed PWA branding from AJ's Garage to Pocket 64.
- Added new Pocket 64 app icons and a transparent Pocket 64 header banner.
- Added a round account icon beside the header brand; tapping it lets each signed-in user upload a private custom icon.
- Removed the Private Collection header label and removed the collection car-count line from the main page.
- Moved Refresh beside Sign Out in the header.
- Moved Export and Restore beside Sort on the left, shortened the labels, and styled them as blue text links.
- Added a Social navigation box between Collection and Stats; all four navigation boxes share one equal-width row.
- Added a Social Feed placeholder for future recent-addition/reaction features.
- Added a native Share button to saved car details so iPhone/Windows can offer installed destinations such as Facebook, Instagram, Messages, Mail, and more.
- Reworked Brand Stats filtering to use a separate brand filter with a compact removable “×” pill instead of filling the search box.
- Preserved all v28/v29 lazy-loading, background-return, quantity, backup/restore, and editor cleanup behavior.
- Bumped the PWA cache and all asset versions to v30.

## v31
- Added **Settings** next to Restore; it opens a simple “Settings coming soon” placeholder.
- Added a persistent, per-account on-device cache for private car photos so already-loaded photos can be reused without repeatedly downloading them from Supabase.
- Reduced photo preloading distance so images are fetched closer to when they actually enter view.
- Export now reuses locally cached photo blobs when available instead of automatically downloading every photo from Supabase again.
- Replaced photos and restored photos invalidate their cached copy so the updated image is shown.
- Service worker upgrades preserve the private photo cache between Pocket 64 releases.


## v32
- Keeps the Collection utility controls on one compact row on mobile: Sort dropdown, Export, Restore, Settings.
- Tightens the Sort control to prevent wrapping on narrow iPhone widths.


## v33
- Forces Sort, Export, Restore, and Settings into one compact row on narrow phones.
- Shortens visible Sort option labels so the dropdown does not push utility links onto another line.
- Preserves v31/v32 persistent private photo caching and egress optimizations.


## Version 2.0
- Resets the public version numbering to the 2.x series.
- Polishes the Add/Edit Car form, especially Brand + Custom alignment and narrow-screen spacing.
- Replaces the boxed Custom checkbox treatment with a clean aligned checkbox.
- Adds a real basic Settings screen.
- Adds Dark, Light, and System appearance choices saved on the device.
- Shows the current Pocket 64 version in Settings.
- Adds Profile Icon access from Settings.
- Preserves the persistent private photo cache and all v33 collection behavior.


## Version 2.1.1

- Moved Refresh beside Settings in the compact collection utility row.
- Softened Add/Edit Car field outlines and made the focused field the visual emphasis.
- Added a gentle, dismissible backup reminder for established garages, plus a last-backup date in Settings.
- Reworked Share to generate a standalone branded Pocket 64 PNG card for the selected car and use the native share sheet when file sharing is supported.
- Preserved the persistent private-photo cache and all v2.0 behavior.


## Version 2.2

- Removed Quick Add from the main navigation.
- Moved Export and Restore into Settings under Backup & Restore.
- Replaced the collection utility links with compact Settings and Refresh buttons.
- Slimmed the Search field and + Add button slightly.
- Normalized Add/Edit Car paired-field label heights so controls align cleanly on the same row.
- Added a restrained electric-blue accent to the Pocket 64 banner.
- Preserved the v2.1.1 login/auth hotfix and persistent private-photo cache.


## Version 2.3

- Add/Edit Car free-text collection fields now uppercase while typing and save uppercase to the database.
- Notes remain normal mixed case.
- Special Category displays in uppercase without changing its internal styling values.
- Removed the Type your own / Custom Special Category input for new cars.
- Existing legacy custom Special Category values are preserved when editing old records.
- Darkened the Add/Edit Car backdrop and form surfaces so the brick texture is much quieter.
- Existing collection rows were normalized to uppercase for the matching car-data columns.


## Version 2.3.1

- Hotfix: corrected a JavaScript syntax typo in the v2.3 uppercase input listener that prevented app/login initialization.


## Version 2.3.2

- Hotfix: restored the missing `function` keyword on `populateYearOptions`.
- This fixes the runtime startup failure that prevented the login UI from initializing.
- No Supabase schema or collection-data changes in this hotfix.


## Version 2.4

- Premium Pocket 64 branding refresh based on the selected metallic performance concept.
- Replaced the header/auth banner with a sharper silver-and-metallic-blue production wordmark.
- Replaced Home Screen icons with a simplified metallic-blue 64 emblem optimized for small sizes.
- Default round profile icon now visually matches the app branding; user-uploaded profile icons still override it.
- No authentication, Supabase schema, collection-data, or Add/Edit behavior changes.


## Version 2.4.1

- Header layout polish: visually centered the Pocket 64 banner in the top bar.
- Added more spacing between the personal profile icon and the brand banner.
- Increased logo breathing room so the full wheel/tire shows cleanly without feeling clipped.
- Branding design unchanged; this is a presentation/layout refinement only.


## Version 2.4.2

- Cache-busting hotfix for the Pocket 64 header logo.
- Renamed the banner asset so Safari/service worker must fetch the new centered, uncropped artwork.
- No auth, database, collection, or form logic changes.


## Version 2.4.3

- Fixed the header alignment rules to target the actual Pocket 64 header classes.
- Centered the Pocket 64 logo against the full screen instead of positioning it beside the personal icon.
- Preserved full wheel/tire breathing room in the banner asset.
- Added separation between the centered brand logo and the personal profile icon.
- No auth, database, form, or collection behavior changes.


## Version 2.4.4

- Reduced the centered Pocket 64 banner size for better breathing room.
- Adjusted the header presentation so the full tire/wheel can display without top clipping.
- Removed Settings and Refresh boxes from the Collection utility row.
- Replaced the top-right Sign Out control with a standard gear Settings button.
- Moved Refresh into Settings.
- Moved Sign Out into Settings under Account.
- No database or collection-data changes.


## Version 2.4.5

- Simplified the top-right Settings control.
- Removed the circular background, border, and button chrome.
- Increased the gear icon to a normal, easy-to-tap visual size.
- Logo/header artwork intentionally left unchanged in this patch.
- No auth, database, collection, or form logic changes.


## Version 2.4.6

- Increased the top-right Settings gear size for better visibility and easier tapping.
- Widened the Sort control to better use the available Collection header space.
- Logo/header artwork intentionally unchanged.
- No auth, database, collection-data, or form behavior changes.


## Version 2.4.7

- Header alignment refinement only.
- Lowered the Pocket 64 banner slightly so it sits more in line with the profile icon and Settings gear.
- Kept the logo artwork itself unchanged.
- No auth, database, collection, or form logic changes.


## Version 2.4.8

- Header refinement only.
- Shrunk the Pocket 64 banner slightly more while preserving the improved lower alignment.
- No logo artwork changes, and no auth/database/form behavior changes.


## Version 2.4.9

- Shrunk the centered Pocket 64 banner another step.
- Slimmed the Search row and Add button vertically to make the Collection header feel lighter.
- Kept existing alignment, Settings placement, Refresh-in-Settings, and Sign Out-in-Settings behavior.
- No auth, database, collection-data, or form logic changes.


## Version 2.5.1

- Replaced the header artwork with the new Speedline Pocket 64 wordmark.
- Uses the stable v2.4.9 app/layout behavior as the base.
- Header logo only: no auth, database, collection-data, settings, or form logic changes.


## Version 2.5.2

- Enlarged the Speedline Pocket 64 header logo.
- Lowered the logo slightly so it sits more in line with the profile icon and Settings gear.
- Tuned the centered header presentation while preserving the same v2.5.1 logo artwork.
- No auth, database, collection-data, settings, or form logic changes.


## Version 2.5.3

- Enlarged the Speedline Pocket 64 header logo again.
- Preserved the improved v2.5.2 alignment and vertical placement.
- No auth, database, collection-data, settings, or form logic changes.


## Version 2.5.4

- Increased the Speedline Pocket 64 header logo by two additional size steps.
- Preserved the successful v2.5.2/v2.5.3 vertical alignment.
- No auth, database, collection-data, settings, or form logic changes.


## Version 2.5.5

- Increased the Speedline Pocket 64 header logo by two more size steps.
- Preserved the existing successful alignment.
- No auth, database, collection-data, settings, or form logic changes.


## Version 2.5.6

- Increased the Speedline Pocket 64 header logo by three additional size steps.
- Preserved the existing alignment.
- No auth, database, collection-data, settings, or form logic changes.


## Version 2.5.7

- Moved the Pocket 64 header logo to the far right.
- Removed the Settings gear from the top bar.
- Added a Settings box beside Sort on the Collection utility row.
- Preserved the current logo size and vertical alignment.
- No auth, database, collection-data, or form logic changes.


## Version 2.5.8

- Increased the right-aligned Pocket 64 logo by two more size steps.
- Rebuilt the Collection row so Sort and Settings stay on the same line.
- Sort now uses roughly twice the width of Settings.
- No auth, database, collection-data, or form logic changes.


## Version 2.5.9

- Increased the right-aligned Pocket 64 logo by two more size steps.
- Made the Sort box longer by widening the Sort/Settings row ratio.
- Increased the Settings button text and icon size for readability.
- No auth, database, collection-data, or form logic changes.


## Version 2.6

- Locked the current Pocket 64 logo in place.
- Widened the Settings box beside Sort.
- Replaced the editable Quantity field with a non-editable QTY display controlled only by minus/plus.
- Tightened label-to-field spacing throughout Add/Edit Car.
- Reduced form padding, row gaps, field heights, photo area height, and Notes height to reduce scrolling.
- Enlarged and moved dropdown arrows farther right.
- No auth, RLS, storage, database schema, or collection ownership behavior changes.


## Version 2.6.1

- Fixed the Sort/Settings row so Sort receives visibly more horizontal space.
- Squared up Quantity and Special Category into equal side-by-side sections.
- Squared up Model Year and Color into equal side-by-side sections.
- Matched control heights, spacing, and widths across those paired fields.
- No auth, database, collection-data, or form-save logic changes.


## Version 2.6.2

- Stretched Sort to use the full remaining row width right up to Settings.
- Increased Settings text and gear size.
- Made Quantity + Special Category a true equal-width pair.
- Kept Model Year + Color as a true equal-width pair with matching control geometry.
- Tightened label spacing throughout Add/Edit Car so labels sit directly above their assigned controls.
- No auth, database, collection-data, or save logic changes.


## Version 2.6.3

- Restored and locked the approved Pocket 64 logo vertical position.
- Moved the logo back down without changing its size or right alignment.
- No Add Car, Sort/Settings, auth, database, or collection behavior changes.


## Version 2.6.4

- Increased the personal profile icon size slightly.
- Aligned the profile icon more closely with the Pocket 64 logo line.
- Removed the visible SORT label while keeping the sort control accessible.
- Renamed the Social navigation label to Feed.
- No auth, database, collection-data, or form logic changes.


## Version 2.7.0
- Model Year label renamed to Release Year (same underlying database field).
- Feed renamed to Showcase; placeholder retained for future use.
- Showcase placeholder gets a restrained metallic-gold border/glow.
- Added read-only 2025 Hot Wheels catalog lookup to Add Car model autocomplete.
- Existing garage-model autocomplete still takes priority.
- Selecting a catalog result prefills Model, Brand, Release Year, and General Number, plus any catalog fields available later.
- No personal car rows are modified by catalog lookup.


## Version 2.7.1
- Removed all 2025 Hot Wheels catalog search/autofill code.
- Model autocomplete once again searches only the user's own collection.
- Release Year wording retained.
- Showcase wording and metallic-gold border retained.
- No personal collection schema, auth, storage, photo cache, or layout changes.


## Version 2.7.2
- Top navigation changed to Home / Showcase / Stats / Settings.
- Existing Collection screen is now labeled Home; functionality is unchanged.
- Showcase gets a tiny metallic-gold trophy icon.
- Existing Settings button moved from the Sort row into top navigation; same settings behavior/ID retained.
- Sort now spans the full row beneath the collection toolbar.
- Release Year, Showcase styling, logo/header, Add Car layout, auth, database, and photo cache remain unchanged.


## Version 2.7.3
- Rebuilt the main collection controls into a two-column grid.
- Search and Sort now stack on the left with matching width and height.
- Added a premium right-side START / ADD CAR button spanning both rows.
- Existing top navigation, Showcase, Release Year, logo/header, auth, photo cache, and collection behavior are unchanged.


## Version 2.7.4
- Fixed Sort vertical alignment so Search and Sort sit level in the left stack.
- Replaced the rectangular START / ADD CAR control with a round wheel-inspired START button.
- New button uses a black tire, metallic gold rim, subtle spoke detail, and centered START label.
- Removed the previous outer placement ring/halo look.


## Version 2.7.5
- Hard-fixed Sort vertical position by removing inherited summary-row padding.
- Removed the wheel START button completely.
- Added a larger garage-style Add Car control with a clean garage graphic and gold + badge.
- Search/Sort proportions and top navigation remain unchanged.


## Version 2.7.6
- Restored visible dropdown chevrons on the Sort select.
- Replaced the garage Add Car button with a premium action panel.
- New Add Car control uses a sleek car silhouette, gold plus orb, metallic dark styling, and stronger visual impact.


## Version 2.7.7
- Refined the Add Car button graphic.
- Replaced the abstract car drawing with a cleaner, more realistic Porsche-like 3/4 front sports-car silhouette.
- Preserved the premium dark panel, gold plus orb, and overall button styling.


## Version 2.7.8
- Replaced the CSS-drawn Add Car vehicle with the approved realistic metallic-blue sports car render.
- Car uses a transparent PNG asset and is sized specifically for the Add Car action panel.
- Preserved the premium dark panel, gold plus orb, Sort arrows, and existing behavior.


## Version 2.8.0
- Test catalog autocomplete for Hot Wheels with read-only Supabase catalog rows.
- Selecting a catalog result autofills brand, model, release year, toy number, series, general number, series number, and TH/STH when available.
- Color remains blank by design.
- Added Settings → Find Exact Duplicates with review-first photo selection and quantity merging.
- Added mobile 16px editor form text to stop Safari auto-zoom without changing field geometry.


## Version 2.8.1
- Removed the redundant Find Exact Duplicates card from Settings.
- Existing Add Car/save-time duplicate protection remains unchanged.
- Catalog search/autofill behavior remains unchanged.


## Version 2.8.2
- Full-catalog deployment build for the 2020–2026 Hot Wheels catalog.
- Version/cache bump only; keeps the working catalog search/autofill behavior from v2.8.1.
- Keeps save-time duplicate protection while leaving the redundant Settings duplicate scanner removed.
- Preserves auth, owner-scoped garage data, private photo storage, and persistent private-photo caching.


## Version 2.8.3
- Added Toy Number catalog lookup/autofill in Add Car. Typing a catalog Toy Number now shows matching catalog releases and selecting one fills the same fields as Model search.


## v2.9.0
- Renamed Unique Cars to Unique Items.
- None only appears in Brand Stats when blank/None-brand items exist; blank brands count as None.
- Delete now asks for confirmation with the requested wording.
- Favorites UI, card badge, and clickable Favorites stat are ready.
- Multipack category and common pack-size picker are ready; Total Cars uses quantity x pack size.
- Favorites and pack-size persistence activate automatically after DATABASE-UPDATE-LATER.sql is applied. Until then, those controls stay safely hidden/disabled so the existing database keeps working.


## v3.0.1
- Refined Favorite placement on Add/Edit Car: Favorite now sits directly above Custom in the existing flag stack without a decorative blue star beside the Favorite label.
- The shiny metallic-blue star remains reserved for the collection-card Favorite badge.
- Existing cars are fully eligible to become Favorites once the database update is applied; existing rows default to not-favorite and can be marked Favorite from Edit Car.
- No database migration is required until Favorites/Multipacks are activated with DATABASE-UPDATE-LATER.sql.


## v3.0.1
- Favorites are card-only; removed Favorite from Add/Edit Car.
- Favorite star upgraded to a brighter metallic-blue/chrome treatment.
- Added a card ••• menu for Add/Remove from Showcase instead of long-press.
- Showcase page now displays cars selected for Showcase.


## v3.0.3
- Restored the original compact metallic-blue Favorite star treatment on collection cards.
- Removed the three-dot Showcase menu from collection cards.
- Added Showcase as a clean Add/Edit Car checkbox beside the existing entry flags.
- Showcase remains a separate collection view and can still be removed from the Showcase screen.
- Bumped PWA cache/assets to 3.0.3.

## v3.0.3
- Rebuilt Add/Edit Car into a compact, consistent layout aimed at minimal scrolling.
- Reduced photo area height while preserving a useful card preview.
- Standardized Add/Edit label, input, select, and textarea typography/sizing.
- Paired Brand + Model, Quantity + Special, Year + Color, and Toy Number + Exclusive for faster entry.
- Moved Showcase + Custom into a compact Options row near the bottom.
- Reduced default Notes height; it remains resizable.
- Preserved all existing data fields and behavior.


## v3.0.5
- Reduced Model and Toy Number / SKU suggestion popup size and typography.
- Renamed Toy Number to Toy Number / SKU.
- Limited automatic exclusive detection to Toy Number / SKU catalog matching only.
- Toy Number / SKU suggestions explicitly label retailer-exclusive catalog records as POSSIBLE EXCLUSIVE.
- Model suggestions still identify/fill cars but do not apply exclusive status.
- Bumped PWA cache/assets to 3.0.5.
