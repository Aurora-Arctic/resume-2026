# Layout Setup — Summary

Full implementation history: [claude-docs/transcripts/LAYOUT-SETUP.md](transcripts/LAYOUT-SETUP.md)

- `Layout` (`src/components/Layout`) wraps every page: `.paper-chrome`/`.paper-card` shell, renders `ThemeToggle`, `BackgroundCredit`, and `RestoreTooltips`.
- Fonts: Lexend (body) / Bitter (headings) — `$font-body`/`$font-heading` in `src/scss/_variables.scss`, applied globally via `src/scss/_typography.scss`. The Google Fonts CSS itself is loaded via a `<link rel="preconnect">`×2 + `<link rel="stylesheet">` injected into `<head>` by `gatsby-ssr.ts`'s `onRenderBody`, not a SCSS `@import` — see "Moving the Google Fonts request out of the SCSS bundle" in the transcript.
- Colors: `$wine-dark` (dark page background), `$silver-oxide`/`$lavender-oxide` (light-mode card background) — all in `_variables.scss`.
- Print: `Layout/index.scss`'s `@media print` forces a plain white page and drops the card's shadow/padding/background; a separate `@page` rule sets size/margin.
- Every component owns a colocated `index.scss`; only two shared partials remain in `src/scss/` (`_variables.scss`, `_typography.scss`), pulled in with `@use` (not the deprecated `@import`).
- A shared `_buttons.scss` base is used by `ThemeToggle` and `RestoreTooltips` for consistent button styling.
