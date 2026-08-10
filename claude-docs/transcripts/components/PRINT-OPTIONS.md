# PrintOptions — Implementation Record

This document is a transcript of the work done to add `src/components/PrintOptions/index.tsx` — a Ctrl/Cmd+P-triggered modal for picking a print detail tier before printing.

## Requirements

1. Hijack Ctrl/Cmd+P, and add a printer-icon button at the top-right of the page, both opening a "window" (modal) over the page instead of the browser's native print dialog.
2. Four detail tiers: Full, Summary, Minimal, and Application ("minimal details in a linear page layout").
3. Icon sourced from Font Awesome.
4. **Mechanism only** — per explicit user correction, this task builds only the class-based show/hide plumbing (the `data-print-mode` attribute + `print-hide-*` classes) and the modal/keybinding wiring. Assigning those classes to actual resume content, section-by-section, is deferred to the user; no section component or `resume.ts` was touched.
5. The tier selection must have **zero effect on the on-screen/web rendering** — print only.

## Design decisions

### Scoping "mechanism only"

Initial discussion sketched concrete Full/Summary/Minimal/Application content differences per resume section. The user cut this short: "Just create the funtionality to show and hide by class and I'll handle assigning them later." This collapsed what would have been per-section content-filtering logic into a generic, symmetric mechanism — three independent CSS classes plus one DOM attribute — with no changes needed to `resume.ts` or any of the six section components. "Must not impact the web version" is satisfied structurally, not by convention: every rule that reads `data-print-mode` or the `print-hide-*` classes lives inside `@media print` (`src/scss/_print.scss`), so they're inert on screen regardless of value.

### Which tiers collapse to a single column

`Resume`/`Skills` already forced a single-column print layout unconditionally, predating tier selection. First pass scoped that forcing to Minimal + Application ("Let's not do that for the full print or summary"). A later follow-up narrowed it further: **only Application** changes the print layout — Full, Summary, and Minimal all print using the same (possibly multi-column) layout as the web version. `_print.scss`'s `linear-print-tiers` mixin was updated accordingly (`html[data-print-mode='application'] & { @content; }`, dropping the `minimal` branch), and both `Resume/index.scss` and `Skills/index.scss`'s comments/usage updated to match.

### Font Awesome: icon only, not the webfont

The user has no Font Awesome install in this repo at all (confirmed via repo-wide search) despite mentioning "an older version." The standard `@fortawesome/fontawesome-free` usage (`css/*.css` + `webfonts/*.woff2`, `<i class="fa-solid fa-print">`) ships the entire solid-style webfont for one icon. Per explicit correction ("I want to only import the icons, not the full font"), the package is instead a **devDependency only** — `npm install --save-dev @fortawesome/fontawesome-free` — used purely as the canonical source for `svgs/solid/print.svg`'s `<path d="...">`, hand-transcribed into an inline `<svg fill="currentColor">` in `PrintOptions/index.tsx`, matching `ThemeToggle`'s existing inline-SVG icon convention. No `gatsby-browser.ts` changes, no webfont network request.

### Modal shape: manual `role="dialog"`, not `<dialog>`

Oxlint's `jsx-a11y/prefer-tag-over-role` flags a `div[role="dialog"]` in favor of the native `<dialog>` element. Native `<dialog>` was considered but rejected: this task also requires the modal to fade in/out, and `<dialog>` shows/hides via the UA's `display: none` toggle on `showModal()`/`close()`, which can't be transitioned without `@starting-style` (not assumed to be broadly supported here). Kept as a styled `div` with explicit ARIA (`role="dialog"`, `aria-modal`, `aria-labelledby`) plus a manually-built Tab focus trap and Escape handling, with a single `// oxlint-disable-line jsx-a11y/prefer-tag-over-role` and an inline comment explaining why. (Oxlint's disable-comment support turned out to only reliably suppress same-line, not `-next-line` inside JSX — confirmed empirically after `oxlint-disable-next-line` silently had no effect.)

### Fading an always-mounted backdrop

Initial version conditionally rendered the backdrop/panel (`{isOpen && (...)}`) — simple, but a removed element can't play a closing CSS transition. Changed to always render the backdrop, toggling an `aria-hidden` attribute and a `--open` modifier class instead. The fade itself reuses `Tooltip`'s own opacity+visibility technique verbatim: both properties share one `transition`, so `visibility` (a discrete, non-interpolable property) flips at the _start_ of the transition when animating toward `visible` (content appears immediately as it fades in) but only at the _end_ when animating toward `hidden` (content stays painted — and in the tab order — for the whole fade-out instead of vanishing instantly). This also meant existing "is the dialog closed" unit tests (`queryByRole('dialog')).not.toBeInTheDocument()`) needed no rework: Testing Library's role queries already exclude anything with `aria-hidden="true"` on an ancestor, regardless of whether jsdom has any real CSS loaded to evaluate `visibility` from.

### Backdrop click without a panel click-handler

The panel originally stopped propagation on click, so a click landing on the backdrop (but outside the panel) could close it. This tripped `jsx-a11y/no-noninteractive-element-interactions` (a non-interactive `div` with a click handler) for no real interactive purpose — the panel's handler existed purely to block bubbling. Switched to the standard light-dismiss recipe instead: the backdrop's own `onClick` only fires `setIsOpen(false)` when `event.target === event.currentTarget`, i.e. the click landed directly on the backdrop, not on a descendant. This let the panel's click handler be removed entirely, along with its matching lint warnings; `role="presentation"` on the backdrop resolved the remaining static-element-interaction warnings on it.

### Focus trap

Added after an explicit "make sure it's accessible" follow-up. A single merged `keydown` effect (only wired up while `isOpen`) handles both Escape-to-close and Tab/Shift+Tab cycling: on Tab it queries all focusable descendants of the panel (`button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])`) and wraps focus from the last back to the first (or vice versa for Shift+Tab) via `preventDefault()`, matching the WAI-ARIA dialog pattern's expectation that content behind an open modal is unreachable via keyboard. `aria-haspopup="dialog"` was also added to the trigger button.

### Print button color

Follow-up request: "The Print button should follow the same color as the buttons on the paper." The shared button base (`_buttons.scss`) fills a button's `::before` with `$wine-dark` only inside `.paper-card` (the on-paper look) and `$silver-oxide` everywhere else (the off-paper default). Since the modal renders as a `Layout`-level sibling of `.paper-card`, not a page-content descendant, `.print-options__confirm` would get the off-paper default; overridden locally to `$wine-dark` so "Print" reads as one of the resume's own actions. Hover/focus/active colors are already on-paper/off-paper-agnostic in the shared system, so only the resting fill needed the override.

### Tooltip position

Follow-up: "Move the tooltip 0.5rem down." `.print-options-tooltip`'s gap changed from `calc(100% + 0.5rem)` to `calc(100% + 1rem)`, with `--tooltip-bridge-reach` (the invisible hover-bridge closing that gap, same mechanism as every other tooltip in the app) updated to match.

## Files changed

- `src/components/PrintOptions/index.tsx`, `index.scss`, `index.test.tsx` (new) — trigger button, modal, keybinding, focus trap.
- `src/scss/_print.scss` (new) — `print-hide-{summary,minimal,application}` visibility rules and the `linear-print-tiers` mixin.
- `src/components/Layout/index.tsx` — mounts `<PrintOptions />` as a `.paper-card` sibling, alongside `RestoreTooltips`.
- `src/components/Layout/index.scss` — `@use '../../scss/print';`.
- `src/components/Resume/index.scss`, `src/components/Skills/index.scss` — their pre-existing unconditional forced-single-column print rules now gated through `linear-print-tiers` (Application tier only).
- `src/scss/_buttons.scss` — added `.print-options__dismiss` to the shared button system's exemption list, alongside `.tooltip__dismiss`.
- `package.json` — `@fortawesome/fontawesome-free` as a devDependency (reference-only, not imported at runtime).
- `e2e/print-options.spec.ts` (new).
- `claude-docs/components/PRINT-OPTIONS.md`, `claude-docs/transcripts/components/PRINT-OPTIONS.md` (this file) — new.
- `CLAUDE.md` — Architecture section, `Layout` bullet extended to mention `PrintOptions`.

## Bugs caught during verification

- **Cross-test mock leakage**: `window.print` is the same jsdom `window` object across every test in a file (not recreated per test). Without restoring spies, a later test's `vi.spyOn(window, 'print')` wrapped the _previous_ test's still-active mock, inheriting its call count (a test expecting 1 call saw 2). Fixed with `afterEach(() => vi.restoreAllMocks())`.
- **Raw `window.dispatchEvent` outside `act()`**: unit tests that dispatched a `KeyboardEvent` directly via `window.dispatchEvent(...)` instead of Testing Library's `fireEvent(window, ...)` could leave a state update unflushed at assertion time (or bleed into the next test), since only `fireEvent` wraps the dispatch in `act()`. Switched every raw dispatch to `fireEvent(window, event)` (still the same event object, so `event.defaultPrevented` remains readable afterward).
- **Playwright role-name substring matching**: `getByRole('button', { name: 'Print' })` and `getByRole('radio', { name: 'Minimal details' })` both matched more than one element ("Choose what to print" / "Close print options" also contain "print"; the Application tier's accessible name starts with its own description text, "Minimal details..."). Fixed by adding `exact: true` to both lookups.
- **Ctrl+P e2e flake**: `page.evaluate` has no built-in actionability wait the way locator actions do — dispatching the synthetic Ctrl+P keydown event immediately after `page.goto()` sometimes ran before Gatsby's client bundle had hydrated and attached `PrintOptions`' own listener, silently missing it (a one-shot DOM event, not queued). Fixed by waiting for the trigger button to be visible first, as a hydration proxy.
- `page.keyboard.press('Control+p')` itself never reached the page's `keydown` listener at all under Playwright/Chromium automation (the real OS-reserved shortcut appears to be intercepted before delivery) — the Ctrl+P e2e test dispatches the same `KeyboardEvent` via `page.evaluate` instead, exercising `PrintOptions`' own handler directly; genuine end-to-end shortcut interception is a manual `npm run develop` check instead.

## Verification status

- `npm run lint`, `npm run format:check`, `npm run typecheck` — pass.
- `npm run test:coverage` — 82/82 tests pass; `PrintOptions` at 98.25%/94.73%/97.72%/100% (statements/branches/functions/lines), well above the repo's 80% gate.
- `npm run test:e2e:coverage` — 33/33 tests pass, including the new `e2e/print-options.spec.ts`.
- `npm run develop` / `npm run build && npm run serve` manual checks — not yet run in this environment (no browser available); left for the user per usual practice for UI-facing changes.

## Follow-up: real-print grid bug + per-tier descriptions

After the initial implementation landed, the user reported that Full,
Summary, and Minimal were still printing single-column, even though
`linear-print-tiers` was already correctly scoped to Application only (the
earlier fix in "Which tiers collapse to a single column" above). The mixin
scoping wasn't the bug — the desktop grid those three tiers are supposed to
_keep_ was never turning on during a real print in the first place.

### Root cause: print media queries evaluate against the page, not the viewport

`Resume`/`Skills`' multi-column grids are gated behind
`@media (min-width: $breakpoint-desktop)` (1024px) — a screen breakpoint.
Browsers evaluate `width`/`min-width` media features during an actual print
against the physical page box (Letter ≈ 816px wide before margins, narrower
after), not the browser window's viewport width. Since 816px never satisfies
a 1024px `min-width`, that breakpoint simply never matches on paper — for
_any_ tier, not just the ones meant to collapse. The desktop grid rule was
never firing in print at all; every tier was accidentally falling through to
the mobile-first `display: flex; flex-direction: column;` base case.

This also explained why it went undetected during the original
verification: the e2e assertions (`e2e/print-options.spec.ts`) used
`page.setViewportSize({ width: 1280, ... })` before `page.emulateMedia({
media: 'print' })`. Playwright's `emulateMedia` only flips the media-type
match flag; it doesn't re-layout against a page-box width the way a real
print/print-preview/`page.pdf()` does, so the tests kept evaluating
`min-width: 1024px` against the 1280px viewport and passed regardless of
whether the underlying rule would work on an actual printed page.

### Fix: reassert the grid explicitly for non-Application tiers

Added a second mixin to `_print.scss`, `grid-print-tiers`
(`html:not([data-print-mode='application']) & { @content; }`), a mirror
image of `linear-print-tiers`. `Resume/index.scss` and `Skills/index.scss`
now use it to reassert their desktop grid's `display`/`grid-template-columns`
values directly inside `@media print`, unconditional of any width check.
`Resume/index.scss` also needed print-only mirrors of its
`.resume-summary`/`.resume-header`/`.resume-skills,.resume-experience,...`
grid-placement rules (previously only inside the same now-dead
`@media (min-width: $breakpoint-desktop)` block) — without them the grid
container would switch to two columns but the header/summary swap and
full-width spanning wouldn't follow.

The e2e layout tests were changed to set a viewport _below_
`$breakpoint-desktop` (800px, not 1280px) before asserting the grid — this
is what actually proves the grid comes from the new print-specific rule and
not from the desktop breakpoint coincidentally still matching.

### Per-tier descriptions

The user asked for a description under each tier's label, matching
Application's existing "Minimal details in a plain, linear layout." — but
asked to be consulted on the wording rather than have it invented silently.
Proposed and confirmed: Full → "All contents.", Summary → "A condensed
version, trimmed to the highlights.", Minimal → "Just the essentials."

Since a description lives in the same `<label>` as its radio input, it
becomes part of that option's accessible name (label text + description
text concatenated). This broke every exact/substring name-based radio
lookup added during the original implementation (`getByRole('radio', {
name: 'Full details' })` no longer matches an accessible name of "Full
details All contents."). Fixed by anchoring each lookup to the start of the
label instead of hardcoding the full label+description string — a plain
substring match doesn't work either, since Application's description text
("Minimal details in a plain, linear layout.") starts with the same words
as the Minimal tier's own label, so an unanchored match still hits both.
`PrintOptions/index.test.tsx` uses a `/^Full details/`-style RegExp;
`e2e/print-options.spec.ts`'s `tierRadio` helper builds one dynamically
(`new RegExp(\`^${label}\`)`) instead of its previous `exact: true`.

### Files changed (this follow-up)

- `src/scss/_print.scss` — added `grid-print-tiers` mixin.
- `src/components/Resume/index.scss` — reasserts the grid + placement rules
  in print for every tier except Application.
- `src/components/Skills/index.scss` — reasserts the 3-column skills grid in
  print for every tier except Application.
- `src/components/PrintOptions/index.tsx` — added `description` to Full,
  Summary, and Minimal.
- `src/components/PrintOptions/index.test.tsx` — anchored radio-name
  queries; parameterized the description test across all four tiers.
- `e2e/print-options.spec.ts` — `tierRadio` now anchors on the label prefix;
  the grid-layout tests use a sub-breakpoint viewport so they actually
  exercise the print-specific rule instead of the (print-inert) desktop one.
- `claude-docs/components/PRINT-OPTIONS.md` — updated.

### Verification status (this follow-up)

- `npm run lint`, `npm run format:check`, `npm run typecheck` — pass.
- `npm run test:coverage` — 85/85 tests pass; `PrintOptions` at
  95.52%/87.87%/100%/100% (statements/branches/functions/lines).
- `npm run test:e2e:coverage` — 33/33 tests pass, including the
  sub-breakpoint-viewport grid assertions.
