# Pocket 64 CSS Audit — v6.3.1

This pass is intentionally non-visual. `styles.css` was audited, but no CSS declarations were removed or reordered in v6.3.1.

## Snapshot
- `styles.css`: 5,710 lines
- Approximate simple CSS rule blocks: 1,237
- Repeated selector strings: 176
- Exact repeated selector+declaration groups detected: 8
- Many repeated rules are historical cascade overrides, especially the header/banner and collection controls. Repetition alone does **not** make them safe to delete.

## Highest-density override areas
- `.brand-header .brand-banner` — 36 rule occurrences across base and responsive sections.
- `#sort-settings-row.sort-settings-row` — 12 occurrences.
- `#sort-settings-row #settings-row-button` — 11 occurrences.
- `.model-suggestion` / `.model-suggestion-thumb` — 9 occurrences each.
- `.quick-core-row` — 8 occurrences.
- Multiple Collection card selectors — 3–4 occurrences each.

## Exact duplicate candidates
The audit found byte-equivalent selector/declaration blocks for these selectors, but they are **not removed yet** because a later repeat may intentionally reassert a value after an intervening override:
- `.topbar`
- `.brand-header`
- `.brand-header .profile-icon-button, .topbar-actions`
- `#sort-settings-row #settings-row-button`
- `.favorite-card-toggle:disabled`
- `#photo2-remove`
- `#photo3-remove`
- `#car-form.compact-editor-form .entry-options-row .showcase-editor-toggle`

## Legacy markers
Only one literal `legacy` marker remains in CSS: `#duplicate-warning.legacy-duplicate-disabled`. No `p64-v###` patch IDs were found in `styles.css`.

## Cleanup decision
Do not bulk-dedupe `styles.css`. Pocket 64 has accumulated intentional later-wins overrides over many revisions, and removing a visually identical earlier or later block can change the cascade when media queries or intervening rules are involved.

For the next CSS cleanup revision, handle one visual area at a time and compare computed behavior on Safari before and after. Recommended first target: the historical header/banner override chain, because it has the highest repetition and can be isolated from Sets, photos, backup, and data behavior.
