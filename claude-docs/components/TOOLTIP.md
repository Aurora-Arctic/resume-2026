# Tooltip — Implementation Record

This document is a transcript of the work done to add `src/components/Tooltip.tsx` — a generic, accessible tooltip — and to apply it to `ThemeToggle.tsx`, whose folded-corner icon button had no visible affordance explaining what it does.

## Requirements

1. Wine-colored (`$wine`), `#fff` text.
2. Fades in/out on `:hover`/`:focus` of the element it's for.
3. Follows accessibility rules and semantic HTML.
4. Adopts visual elements that already exist in the design (the folded-corner triangle's `clip-path` technique).
5. Applied to the theme toggle, announcing "Change to light mode" / "Change to dark mode" depending on the live theme.

## Design decisions

- **Color**: `$wine` (`#6a2854`, `_variables.scss`) — the "accent color" variable, distinct from `$wine-dark` (`#110011`, the page background). No new variable was needed.
- **Accessibility**: standard WAI-ARIA tooltip pattern — `role="tooltip"` on the bubble, its `id` referenced via `aria-describedby` on the trigger. The trigger's `aria-label` remains the accessible _name_; the tooltip supplies a _description_ — complementary, not redundant. `ThemeToggle.tsx`'s `title` attribute was removed, since it would otherwise pop a native browser tooltip alongside the new custom one.
- **Structure**: `Tooltip` clones its `children` (the trigger) via `cloneElement`, adding `aria-describedby` and a `tooltip-trigger` class (a CSS hook only, not used for positioning), then renders `{trigger}` and the `role="tooltip"` bubble as a React Fragment — i.e. as plain DOM siblings, with no wrapper element. All styling lives in `src/scss/layout.scss` (no co-located component `.scss`), matching every other component in this codebase.
- **Dynamic copy without React state**: theme state lives only in the DOM (`data-theme` attribute + `localStorage`, see [THEME-TOGGLE.md](THEME-TOGGLE.md)), not React state, so `ThemeToggle.tsx` passes both possible copy strings to `content` and CSS shows/hides the right one via the same default/`html[data-theme='light']` override pattern already used for the sun/moon icon facets.

### Why a Fragment, not a nested child

The first pass nested the tooltip bubble _inside_ the trigger (an extra child appended via `cloneElement`), reasoning that `.theme-toggle` already has `position: absolute` and so already establishes a containing block for an absolutely-positioned descendant — no wrapper `<span>` needed, which would otherwise have needed its own `position: relative` and broken `.theme-toggle`'s `top: 0; right: 0` corner placement (its containing block would silently become the wrapper instead of `.paper-card`).

That approach broke once implemented: `.theme-toggle` carries `clip-path: polygon(100% 0, 100% 100%, 0 0)` (see [THEME-TOGGLE.md](THEME-TOGGLE.md)'s "Hit-area change" note) — `clip-path` clips _all_ painting of an element, including descendants that visually escape its box via absolute positioning, the same way `overflow: hidden` would. A tooltip nested inside the clipped button was itself clipped to the triangle, hiding almost all of it.

Fixed by rendering the tooltip as a **plain sibling** of the trigger (a Fragment adds no DOM wrapper), positioned via a per-instance placement class (`className` prop on `Tooltip`) rather than positioned automatically relative to the trigger. This does mean placement is the caller's responsibility — reasonable for a small site with one real usage so far, and documented directly in `Tooltip.tsx`.

### Placement iteration

Went through three rounds before landing, each caught by actually looking at the rendered result:

1. **To the left, vertically centered** — the user's first stated preference (explicitly waiving concern about card overflow on narrow viewports). Implemented as a nested child (see above), which then had to be reworked as a sibling once the `clip-path` clipping problem surfaced.
2. **To the left, top-aligned** — once repositioned as a sibling, plain vertical centering on the button's full `5rem`-tall box pointed the arrow at empty space: `.theme-toggle`'s triangle (`clip-path: polygon(100% 0, 100% 100%, 0 0)`) is solid top-to-bottom only at the button's _right_ edge, tapering to a single point at the _top-left_ corner — exactly where a left-side tooltip's arrow would touch. Top-aligning (rather than centering) the tooltip put the arrow near that point instead of the middle of the (mostly transparent, clipped-away) box.
3. **Below the button, right-aligned** (final, per explicit follow-up request) — `.theme-toggle-tooltip { top: calc(5rem + 0.5rem); right: 0.25rem; }`, with the arrow near the tooltip's right edge (`right: 0.5rem` on `::before`, pointing up via `clip-path: polygon(0 100%, 100% 100%, 50% 0)`) rather than centered — again lining the arrow up with the triangle's solid right-edge mass rather than the button's full invisible box.

A small `box-shadow: 0 4px 10px $shadow;` was added to the tooltip per follow-up request — the same `0 / y-offset / blur / $shadow` shape as `.paper-card`'s own `box-shadow: 0 20px 45px $shadow;`, just scaled down. Rounded corners (`border-radius`) were explicitly rejected, keeping the tooltip's square corners consistent with the rest of the design (`.paper-card`, `.theme-toggle` are also square-cornered).

## Files changed

- `src/components/Tooltip.tsx` (new) — the generic component.
- `src/components/Tooltip.test.tsx` (new) — RTL/vitest coverage: trigger/tooltip association via `aria-describedby`, existing trigger children preserved, `className` merged with the `tooltip-trigger` hook class.
- `src/components/ThemeToggle.tsx` — button wrapped in `<Tooltip>`, `title` attribute removed, two conditionally-shown copy spans added as `content`.
- `src/scss/layout.scss` — `.tooltip` (shared look: color, fade transition, shadow, direction-agnostic arrow base), `.tooltip-trigger:hover + .tooltip` / `:focus` (the fade trigger, a sibling selector since there's no wrapper), `.theme-toggle-tooltip` (this instance's placement + arrow direction), `.theme-toggle-tooltip__label--to-light`/`--to-dark` (copy visibility, mirroring the icon facet pattern), and `.tooltip` added to the existing `prefers-reduced-motion: reduce` override.

## Verification status

- `npm run typecheck`, `npm run lint`, `npm test` — all clean; 14 tests passing (existing `ThemeToggle.test.tsx` unchanged and still passing — the button's accessible name/role/`aria-pressed` behavior wasn't touched; 3 new `Tooltip.test.tsx` cases added).
- Visual verification: started the Gatsby dev server and drove headless Chromium directly via Playwright (ad hoc script, same pattern as [LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s own verification notes) to confirm, in the browser: the tooltip fades in on hover, fades out on mouse-away, and fades in again on keyboard `Tab`-focus; the copy correctly flips between "Change to light mode" and "Change to dark mode" depending on the live theme; and the wine-colored bubble with white text, small shadow, and upward-pointing arrow render as intended below-right of the toggle. (Incidentally confirmed Playwright's default Chromium profile reports `prefers-color-scheme: light`, so the site defaulted to light mode for this check rather than dark — expected behavior per `gatsby-ssr.ts`'s `matchMedia` fallback, not a bug.)

## Moved into its own folder, with colocated SCSS

`src/components/Tooltip.tsx` moved to `src/components/Tooltip/index.tsx`, no longer sharing `src/scss/layout.scss` with every other component — `.tooltip`/`.tooltip-trigger` (the generic look: color, fade, shadow, direction-agnostic arrow base) now live in a colocated `src/components/Tooltip/index.scss`. The per-instance placement CSS (`.theme-toggle-tooltip` and its label modifiers) stayed with `ThemeToggle` instead, since that's this particular usage's placement, not part of `Tooltip`'s own generic look — see [THEME-TOGGLE.md](THEME-TOGGLE.md). `Tooltip.test.tsx` moved to `index.test.tsx` alongside it. Full rationale for the restructuring (including the `$font-body` variable move this component's `font-family: $font-body` declaration depended on) is in [../LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s "Splitting component SCSS out of `layout.scss`, per component" section.
