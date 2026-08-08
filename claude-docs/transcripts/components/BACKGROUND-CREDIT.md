# BackgroundCredit — Implementation Record

This document is a transcript of the work done around `src/components/BackgroundCredit.tsx` — the small attribution line for the paper card's background texture. Split out from [LAYOUT-SETUP.md](../LAYOUT-SETUP.md), which covers the general page shell instead.

## Why it exists

The card background texture (originally `src/images/prism.png`) is a subtle, tileable, faceted/geometric pattern from [Subtle Patterns](https://www.toptal.com/designers/subtlepatterns/prism/) ("Prism"), layered on `.paper-card` via `background-image` on top of `$silver-oxide`. Its license requires attribution, hence the standalone `BackgroundCredit` component rather than folding a credit string into `Layout.tsx` directly. Deliberately left in its original dark-gray palette rather than CSS-tinted — the plan from the start was to recolor the source PNG itself to match the card background instead of a CSS tint/blend-mode.

## Current state

- `BackgroundCredit.tsx` renders a single `<p className="background-credit">` with the "Prism"/Michal credit and a link to Subtle Patterns — no props, no state, matching this codebase's other small components (see [TOOLTIP.md](TOOLTIP.md), [THEME-TOGGLE.md](THEME-TOGGLE.md)).
- Rendered in `Layout.tsx` as the last child inside `.paper-card`, after the page's own `{children}`.
- Styling lives in `src/scss/layout.scss` (`.background-credit`): small, low-opacity (`0.6`) text, `a { color: inherit; }` so the link doesn't stand out from the credit text around it, and hidden outright in `@media print` (attribution isn't meaningful on a printed resume).
- **Superseded by two texture variants**: the original single `prism.png` was later split into `prism-silver-oxide.png` (dark mode) and `prism-light.png` (light mode overlay) as part of the [light/dark mode toggle work](THEME-TOGGLE.md). Both are still the same "Prism" pattern, just recolored, so the attribution text itself didn't need to change. The original `prism.png` file remains in `src/images/` but is no longer referenced by any stylesheet.
- Automatically excluded from print by two overlapping mechanisms: `.background-credit`'s own `@media print { display: none; }`, and — even without it — `.paper-card`'s print override resets `background`/`background-image` to `transparent`/`none`, so the texture itself wouldn't render in print regardless.

## Moved into its own folder, with colocated SCSS

`src/components/BackgroundCredit.tsx` moved to `src/components/BackgroundCredit/index.tsx`, with `.background-credit` pulled out of the old shared `src/scss/layout.scss` into a colocated `src/components/BackgroundCredit/index.scss` — this component has no test file, so nothing to move there. See [../LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s "Splitting component SCSS out of `layout.scss`, per component" section for the full rationale behind the per-component-folder restructuring.
