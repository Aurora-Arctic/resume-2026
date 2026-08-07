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
