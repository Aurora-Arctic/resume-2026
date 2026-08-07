# Layout Setup — Implementation Record

This document is a transcript of the work done to set up the site's general page layout: the approved plan, and how the actual implementation ended up differing from it after some back-and-forth on font choice.

## Summary

- A shared `Layout` component (`src/components/Layout.tsx`) now wraps both `src/pages/index.tsx` and `src/pages/404.tsx`, replacing each page's own independent markup/styling.
- Screen: outer page background `$wine-dark` (`#110011`) behind a "paper" card, `$silver-oxide` (`#211d28`) — two separate Sass variables (`src/scss/_variables.scss`) so either can be retuned independently. White text (`$text: #fff`), card elevated with `box-shadow` (`0 20px 45px rgba(8, 7, 9, 0.8)`), square corners, `4rem` padding.
- Print (`@media print`): flips to a plain white page (`$print-bg: #fff`) with `$silver-oxide` (`#211d28`) text, no shadow/padding on the card, `page-break-inside: avoid`. `@page { size: 8.5in 11in; margin: 0.5in; }` sizes the printed sheet.
- Typography (`src/scss/_typography.scss`): body text in Lexend, headings in **Bitter** — chosen after several rounds of narrowing down a "modern goth, still corporate" heading font (see below). Currently: `Lexend` at weight `200` for body copy (`p`), `Bitter` at weight `300` for headings (`h1`–`h4`) — both lighter than their initial pass (body 300, headings 400), which itself was a step down from an even heavier first draft (600/700).
- `src/scss/index.scss` (light theme, no print handling, no shared layout) was deleted and replaced by `src/scss/layout.scss` + the two partials above.
- Scope was deliberately narrowed to **shell only** — colors, typography, print rules, page structure — reusing the existing placeholder heading/copy. Real resume content (contact card, experience, education, skills sections) is explicit future work.
- Card background texture (`src/images/prism.png`): a subtle, tileable, faceted/geometric pattern from [Subtle Patterns](https://www.toptal.com/designers/subtlepatterns/prism/) ("Prism"), layered on `.paper-card` via `background-image` on top of `$silver-oxide`. Deliberately left in its original dark-gray palette for now — the user plans to recolor the PNG itself to match the card background, so no CSS tinting/blend-mode was added. Automatically excluded from print: the print override's `background: transparent` shorthand resets `background-image` to `none` along with the color.

## How the font choice diverged from the plan

The plan's first pass proposed `Lora` for headings, paired with the existing Lexend body font, mirroring the old resume's serif/sans split conceptually. Before implementing, the user asked for something "more modern goth, still corporate appropriate" instead, which took a few rounds to converge on:

1. **First round** (serif/display options): `Fraunces`, `Bodoni Moda`, `Big Shoulders Display` were proposed. The user liked the direction of `Big Shoulders Display` (a literal "gothic" grotesque sans) but found it "too blocky" and asked for something more angular.
2. **Second round** (angular sans options): `Space Grotesk`, `Syne`, `Unbounded` were proposed as more angular, less blocky alternatives. The user redirected back to wanting serif options instead.
3. **Third round** (serif options): `Playfair Display`, `Bodoni Moda`, `IBM Plex Serif` were proposed. The user asked for something that mixes `Playfair Display`'s classic drama with `Syne`'s geometric angularity — a serif/sans hybrid brief.
4. **Fourth round**: `Fraunces` (a serif built with an adjustable "wonk" that gives it geometric, angular character alongside high-contrast classic serif structure) and `Besley` (a more structured, geometric slab-serif) were proposed as the closest real matches. The user pushed back once more, describing the goal as "corporate goth" incorporating "the whimsy of Syne and Playfair's classiness" — which is, in substance, the same brief `Fraunces` was proposed for.
5. **Landed on `Fraunces`** — the one Google Font purpose-built to combine a classic high-contrast serif structure with an adjustable "wonk" axis that reads as angular/whimsical rather than blocky, matching the brief directly rather than as a compromise. Implemented and verified in the browser.
6. **Follow-up**: the initial weights chosen (Lexend 400–700, Fraunces 600/700) read too heavy on screen. Both were dropped to lighter weights — Lexend 300/400/500 (body set at 300) and Fraunces 400/500 (headings set at 400) — closer to the old resume's own `font-weight: 300` body text.
7. **Reopened after seeing it rendered**: the user didn't like `Fraunces` in practice and reframed the brief once more — "something like Syne but with serifs," i.e. a _geometric slab serif_ (serifs built with the same squared-off, structural logic as a grotesque sans, rather than classic bracketed serifs) instead of a high-contrast display serif. `Besley`, `Zilla Slab`, and `Bitter` were proposed as slab-serif candidates at that end of the spectrum, ranging from sharp/structural (`Besley`) to warm/irregular (`Zilla Slab`) to clean/neutral (`Bitter`). The user picked **`Bitter`** — the most restrained, corporate-safe of the three. `_typography.scss`'s `@import` and `$font-heading` were swapped from Fraunces to Bitter accordingly.

## Color naming diverged from the plan too

The plan originally used generic names (`$body-bg`, `$card-bg`) for the two background variables. Before implementation, the user requested specific values and names instead: the outer page background became `$wine-dark: #110011`, and the paper card background became `$silver-oxide: #333` (also reused for the print text color, rather than introducing a third name for the same `#333` value). No `$charcoal` or `$chrome` naming was used, per explicit instruction.

## Post-implementation refinement

After the initial implementation landed, styling was tuned further directly in the editor, in a few passes:

- `src/scss/_variables.scss`: `$silver-oxide` moved off its original `#333` — first to `#1d1e28`, then to its current `#211d28` — a cooler dark navy-charcoal rather than a neutral gray. `$shadow` was retuned alongside it, landing at `rgba(8, 7, 9, 0.8)`.
- `src/scss/layout.scss`: card padding became a uniform `4rem` (was `3rem 1.5rem`), and the screen-mode `border-radius` was dropped entirely — the card now has square corners at all times, not just in print.
- `src/scss/_typography.scss`: heading weight dropped from `400` to `300`, body weight from `300` to `200`; body copy (`p`) size/line-height also shifted, from `1.05rem`/`1.6` to `1.2rem`/`1.25` — tighter line spacing at a slightly larger size.

## Verification status

- `npm run typecheck` — clean, no errors.
- `npm run lint` — clean, no findings.
- `npm test` (scoped to `src/pages`) — `index.test.tsx` and `404.test.tsx` both pass unchanged (they assert on heading/copy text, not markup structure). The full unscoped `npm test` run also surfaces 22 unrelated pre-existing failures under `Docker/claude-home/plugins/...` (a bind-mounted Claude Code plugin cache, not part of this project) — not a regression from this change.
- Visual verification: started the Gatsby dev server and drove headless Chromium directly via Playwright (no `chromium-cli` on `PATH` in this environment, so a small ad hoc script was used instead) to screenshot `/` and `/404` in both normal and `@media print`-emulated rendering, confirming the dark `$wine-dark` page / `$silver-oxide` card split with shadow on screen, and the flip to a plain white/`$silver-oxide`-text page with no shadow in print. Also rendered both pages to actual PDF (`page.pdf()`, which — unlike media-emulation screenshots — respects the `@page` rule) and confirmed each is a single 8.5"×11" page with the `@page` margin applied, so no follow-up on the old resume's font-size-shrink trick was needed for this placeholder-length content.
- Re-verified after adding the `prism.png` pattern: screenshots confirm the texture renders on the card in screen mode and correctly disappears in print (plain white background, no pattern). `npm run typecheck` and `npm run lint` re-run clean.

## Light/dark mode toggle for the paper card

A second `prism-light.png` palette had been prototyped earlier (recolored/contrast-tuned over several rounds, see below) but never wired into the page. This feature makes it selectable: `.paper-card` (not `.paper-chrome`, which stays `$wine-dark` always) can render in either its dark look or a new light look, switchable via a visible toggle, defaulting to `prefers-color-scheme`. Print stays unaffected by any of it.

This went through `EnterPlanMode`/`ExitPlanMode` — a Plan agent's design was reviewed and approved before implementation (see the session's plan file for the full writeup). Key decisions:

- **`$lavender-oxide: #958e9f`** (`_variables.scss`) — the light-mode card background, the darkest facet of `prism-light.png`, mirroring how `$silver-oxide` is the darkest facet of `prism-silver-oxide.png`.
- **Theme tracked via `data-theme` on `<html>`**, not React state: `data-theme="light"` when active, no attribute at all for dark (the unmarked default). `html[data-theme='light'] .paper-card { ... }` is the only new override needed.
- **No-flash-of-wrong-theme via `gatsby-ssr.ts`** (new file): a synchronous inline `<script>`, injected into `<head>` via `onRenderBody`/`setHeadComponents`, reads `localStorage`'s `theme` key or falls back to `matchMedia('(prefers-color-scheme: dark)')`, and sets the attribute before `<body>` paints — necessary because Gatsby statically generates the HTML once at build time with no knowledge of a given visitor's preference. Confirmed in the actual built `public/index.html`: a plain synchronous `<script>` in `<head>`, no `async`/`defer`/`type="module"`.
- **`ThemeToggle.tsx`** (new, standalone component per explicit request) renders identical markup on every render — both icons always in the DOM, pure CSS attribute selectors show/hide the right one — so nothing branches on `localStorage`/`matchMedia` (unavailable at SSR time) and there's no hydration-mismatch risk. The click handler is fully DOM-imperative (no `useState`).
- **Persistence**: no `theme` key in storage → follow `prefers-color-scheme` live (a `matchMedia('change')` listener registered by the same init script, only when there's no stored override). A stored key → explicit override, ignored by the live listener until toggled again.
- **Print-specificity fix**: `html[data-theme='light'] .paper-card` (two selectors) is more specific than the plain `.paper-card` print rule (one selector) — `@media` blocks add no specificity of their own. Without a fix, printing while light mode was active on screen would leak the light-mode background-image into print output. Fixed with `!important` on just the two contested print declarations (`background`, `color`), not the whole print block.
- **Toggle hidden in print** (mid-turn follow-up ask): `.theme-toggle { @media print { display: none; } }`, same pattern as the existing `.background-credit` rule.

### Accessibility pass (mid-turn follow-up ask)

The first draft had two real gaps, caught and fixed before moving on:

- `aria-pressed` was only ever set imperatively in a `useEffect` after mount — meaning the button had no `aria-pressed` at all in the initial static HTML, a real (if brief) gap for assistive tech. Fixed by rendering `aria-pressed={false}` directly in JSX as a safe default (matching the dark-mode default, so no hydration mismatch), corrected post-mount if the actual theme is light.
- The button's hit target was originally the same `clip-path`-triangle as its visual shape — `clip-path` affects hit-testing, not just painting, so the actual clickable area was a thin diagonal sliver rather than a proper touch target. Fixed by keeping the `<button>` itself a full, unclipped square (the real interactive element) and drawing the "folded corner" triangle purely visually via a `pointer-events: none` `::before` pseudo-element layered on top.
- Also added: a visible `:focus-visible` outline drawn _outside_ the button (not inset, which would've been clipped by the visual triangle), and a `title` attribute for a native hover tooltip.

### Icon design iteration

Several rounds, each caught by actually looking at the rendered result rather than reasoning about coordinates blindly:

1. Simple up/down triangles (matching the site's `prism.png` triangle motif directly) — rejected as too abstract to read as "light/dark mode" at a glance.
2. Standard sun-with-rays / crescent-moon glyphs — instantly recognizable, adopted as the base shape language.
3. "Make the moon more eclipsed" — the crescent cutout was widened relative to the outer shape for a thinner, more dramatic sliver.
4. "Make the sun and moon a septagon" — both icons rebuilt from 7-sided polygons (computed via Python for precise, evenly-spaced vertices) instead of circles, matching the eclipse/cutout alignment between the two septagons so the crescent reads cleanly.
5. "Make the sun ray diamonds 2.5x longer, pointing away from center" — rays rebuilt as proper kite shapes (inner point near the sun, outer tip far from it, width only at the midpoint) computed per-angle so each one actually points radially outward, rather than axis-aligned diamonds that only looked radial for 4 of the 8 positions.
6. "Rays too close to the sun, move them out and shrink 10%" — radii recomputed: base pushed outward, tip-to-base length reduced 10%, tangential width reduced 10%, all recalculated to stay within the SVG viewBox.
7. `.theme-toggle::before`'s border color set to `$lavender-oxide` in light mode (base stays `$silver-oxide`) and the icon fill color iterated between `currentColor`/`$text`/`$lavender-oxide` directly in the editor.

### Two real test-environment bugs found and fixed

Neither is specific to this feature's code — both are environment gaps that simply hadn't been exercised by any prior test:

- **`window.localStorage` was `undefined` in the Vitest/jsdom environment** on this project's Node version (v26.5.1) — Node's own native `localStorage` global (a lazy getter that requires `--localstorage-file` to actually work) shadows jsdom's working implementation once Vitest merges jsdom's `window` into the global scope. Confirmed jsdom's own `localStorage` works fine when constructed directly — this is purely a Vitest+jsdom+Node26 integration gap, and `ThemeToggle`'s real `localStorage` usage was already confirmed correct via Playwright screenshots. Fixed with a minimal in-memory `Storage` polyfill in `vitest.setup.ts`, only installed if `window.localStorage` isn't already a working object.
- **React Testing Library's automatic `afterEach(cleanup)` never ran** — `vitest.config.ts` doesn't set `test.globals: true`, which RTL's auto-registration depends on. Every prior test file only ever called `render()` once per file, so the resulting DOM buildup across tests in the same file went unnoticed until `ThemeToggle.test.tsx` (the first file with multiple `it()` blocks each calling `render()`) hit `getByRole` "multiple elements found" errors. Fixed with an explicit `afterEach(() => cleanup())` in `vitest.setup.ts`, the standard pattern for this exact Vitest+RTL configuration.

### Also: scoped `npm test` to `src/`

Unrelated to the toggle itself, but done in the same pass: `vitest.config.ts` picked up dozens of unrelated test files from `Docker/claude-home/` (a bind-mounted Claude Code plugin cache, not part of this project — see earlier "Verification status" notes about this). Replaced the ad hoc `exclude` list with an explicit `include: ['src/**/*.test.{ts,tsx}']`, which scopes discovery to just this project's own tests and makes the `Docker/**` exclusion (and any other future stray directory) unnecessary.

### Also: migrated `layout.scss` off the deprecated Sass `@import` rule

`npm run build` was surfacing `DEPRECATION WARNING [import]: Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0` for `layout.scss`'s two local partial imports. Migrated to the modern module system: `@import './variables'; @import './typography';` became `@use './variables' as *; @use './typography';` — `as *` keeps every variable unprefixed (`$wine-dark`, `$silver-oxide`, etc.) so nothing else in the file needed renaming, while `./typography` doesn't need a namespace since nothing outside it references its members directly (its rules apply themselves, to `body`/`h1`–`h4`/`p`). `_typography.scss`'s own `@import url('https://fonts.googleapis.com/...')` is unrelated and untouched — that's a plain CSS `@import` for an external stylesheet, not a Sass module import, and was never part of this warning. Rebuilt and confirmed the `[import]` warning is gone; the remaining `[legacy-js-api]` warning is unrelated (comes from how `gatsby-plugin-sass` itself invokes the `sass` package, not fixable from within these `.scss` files).

### Verification status

- `npm run typecheck`, `npm run lint`, `npm run format:check` — all clean.
- `npm test` — 3 files, 6 tests, all passing (now scoped to `src/`, so this is the complete, accurate count — no more unrelated `Docker/` noise in the numbers).
- `npm run build` — succeeds, no `[import]` deprecation warnings after the `@use` migration (only the unrelated pre-existing `[legacy-js-api]` one remains). Confirmed the init script is present in the built `public/index.html`'s `<head>`, as a plain synchronous script.
- `npm run test:e2e` — all 7 tests pass, including the 5 new `e2e/theme-toggle.spec.ts` cases: OS-preference defaulting (both light and dark), toggle-click + persistence across reload, storage isolation across a fresh browser context, and print output staying plain/light/toggle-hidden regardless of the active screen theme. One assertion needed a fix after first failing against the production build specifically: `prism-light.png` (9.4KB) gets base64-inlined into the computed `background-image` by Gatsby's production asset pipeline, so a filename-pattern match doesn't hold there — replaced with a before/after value comparison, which is resilient to whether a given build inlines the asset or not.
