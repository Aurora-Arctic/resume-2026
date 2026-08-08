# RestoreTooltips — Implementation Record

This document is a transcript of the work done to add `src/components/RestoreTooltips/index.tsx` — a fixed, always-visible "I Need Tooltips" button that resets every dismissed tooltip at once. Companion to the dismissible-tooltip work in [TOOLTIP.md](TOOLTIP.md); read that first for the `cleared` state/storage design this button resets.

## Requirements

1. A button, fixed to the bottom-right of the viewport, outside `.paper-card` (on the dark `.paper-chrome` page background, not inside the elevated card).
2. Labeled "I Need Tooltips".
3. `$silver-oxide` background (the existing dark-mode paper-card color, `_variables.scss`).
4. Clicking it un-hides every tooltip that's been individually dismissed — a global escape hatch, since a tooltip dismissed via its own × (see [TOOLTIP.md](TOOLTIP.md)) only reappears again via a deliberate >1s hover, which isn't discoverable if the user doesn't already know it's there.

## Design decisions

- **Two-part restore, not one**: clicking the button both removes `Tooltip`'s single `TOOLTIP_STORAGE_KEY` from `localStorage` (covers every dismissed tooltip, including ones not currently mounted — e.g. on a different page) and dispatches `TOOLTIP_RESTORE_EVENT` on `window` (tells any _currently-mounted_ `Tooltip` to update its already-loaded React state immediately, without needing a page reload). Neither alone is sufficient: the storage removal alone wouldn't affect an already-rendered tooltip's in-memory `cleared` state until some future remount; the event alone wouldn't cover tooltips that aren't mounted right now.
- **Why a single storage key, not a scan**: `Tooltip`'s cleared state is stored as one JSON array under one key (`tooltip-cleared`) rather than one `tooltip-cleared:<id>` key per tooltip — a design that was specifically revisited once this button needed to reset all of them at once, since a single key turns that into one `removeItem` call instead of an `Object.keys(localStorage)` prefix scan. See [TOOLTIP.md](TOOLTIP.md)'s "Storage: one key, not one per tooltip".
- **Color**: `$silver-oxide` (`#211d28`, `_variables.scss:4`) — the existing dark-mode paper-card background variable, reused rather than introducing a new one, per explicit request. Deliberately _not_ theme-swapped to `$lavender-oxide` in light mode (unlike `.paper-card` itself) — the ask was for silver-oxide specifically; a light-mode variant is a plausible future follow-up, not something added unprompted.
- **Rendered from `Layout`, not per-page**: sibling of `.paper-card`, inside `.paper-chrome`, alongside `ThemeToggle`/`BackgroundCredit` (which render _inside_ `.paper-card` — this is the one exception, deliberately outside it, per the "outside the page" requirement). `position: fixed` handles staying visible regardless of scroll or which page is showing; DOM placement only needed to put it outside the card's own stacking/clipping context.
- **Hidden in print**: same `@media print { display: none; }` pattern as `.background-credit` and `.theme-toggle` — it's page chrome, not resume content.

## Files changed

- `src/components/RestoreTooltips/index.tsx` (new) — the button + `handleRestore`.
- `src/components/RestoreTooltips/index.scss` (new) — fixed positioning, `$silver-oxide` styling, print hide.
- `src/components/RestoreTooltips/index.test.tsx` (new) — renders with the right label; removes the storage key without touching unrelated keys (e.g. `theme`); integration-style test rendering a real `Tooltip` alongside it, confirming the event wiring actually un-suppresses a mounted tooltip.
- `src/components/Tooltip/index.tsx` — exports `TOOLTIP_STORAGE_KEY`/`TOOLTIP_RESTORE_EVENT` for this component to import; listens for the restore event (see [TOOLTIP.md](TOOLTIP.md)).
- `src/components/Layout/index.tsx` — renders `<RestoreTooltips />` as a `.paper-card` sibling.
- `e2e/tooltip.spec.ts` — includes a case clicking "I Need Tooltips" and confirming a previously-dismissed tooltip reappears without a reload.

## Verification status

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` — TODO, fill in after running.
- `npm run test:e2e` — TODO, fill in after running.

## Adopting the shared button base (`_buttons.scss`)

See [../LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s "A third shared partial: `_buttons.scss`" for the full site-wide rationale. This button's own `background: $silver-oxide;`, `border-radius: 0.5rem;`, `border: none;`, `cursor: pointer;`, and the opacity-based `&:hover, &:focus-visible { opacity: 0.85; }` were all removed from `index.scss` — every one is now supplied by the shared base rule instead: the `$silver-oxide` fill is the shared system's _default off-paper_ color (this button renders outside `.paper-card`, so it gets that default for free, no extra selector needed — requirement 3 above is satisfied by the shared system now, not a bespoke declaration), corners are square (`border-radius: 0`, not `0.5rem` — a real, visible change from before), and hover/focus/active now read `$wine`/`$wine`/`$grape-press` with a bottom-anchored "pushed" shrink of the fill on click (the label text itself doesn't scale), instead of a flat opacity fade. `position: fixed`, `padding`, `color`, `font-family`, `font-size`, and `box-shadow` stayed local — placement/typography/elevation aren't part of the shared button look.
