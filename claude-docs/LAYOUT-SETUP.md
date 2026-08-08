# Layout Setup — Summary

Full implementation history: [claude-docs/transcripts/LAYOUT-SETUP.md](transcripts/LAYOUT-SETUP.md)

- `Layout` (`src/components/Layout`) wraps every page: `.paper-chrome`/`.paper-card` shell, renders `ThemeToggle`, `BackgroundCredit`, and `RestoreTooltips`.
- Fonts: Lexend (body) / Syne (headings) — `$font-body`/`$font-heading` in `src/scss/_variables.scss`, applied globally via `src/scss/_typography.scss`. Self-hosted via `@fontsource/lexend`/`@fontsource/syne`, imported in `gatsby-browser.ts` (only the weights actually used in CSS: Lexend 200/400, Syne 400) — previously loaded from Google Fonts via `<link>`s injected by `gatsby-ssr.ts`'s `onRenderBody`, moved to self-hosting to eliminate the external request chain a PageSpeed Insights audit flagged; see "Self-hosting fonts instead of Google Fonts" in the transcript (supersedes that section's original "Moving the Google Fonts request out of the SCSS bundle" decision). Headings moved off the slab-serif `Bitter` to the geometric sans `Syne` — see "Replacing Bitter with a more angular heading font" in the transcript.
- `.browserslistrc` (repo root) targets `defaults and fully supports es6-module` — no config previously existed, so Babel (`babel-preset-gatsby`, `useBuiltIns: 'usage'`) fell back to browserslist's broad default query and polyfilled/downleveled for legacy browsers this site doesn't need to support, which is exactly the "unused JavaScript" a PageSpeed Insights audit flagged. See "Trimming legacy-browser JS via browserslist" in the transcript.
- Colors: `$wine-dark` (dark page background), `$silver-oxide`/`$lavender-oxide` (light-mode card background) — all in `_variables.scss`.
- Print: `Layout/index.scss`'s `@media print` forces a plain white page and drops the card's shadow/padding/background; a separate `@page` rule sets size/margin.
- Every component owns a colocated `index.scss`; only two shared partials remain in `src/scss/` (`_variables.scss`, `_typography.scss`), pulled in with `@use` (not the deprecated `@import`).
- A shared `_buttons.scss` base is used by `ThemeToggle` and `RestoreTooltips` for consistent button styling.
