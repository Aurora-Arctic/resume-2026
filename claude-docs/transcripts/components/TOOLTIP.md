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

## Dismissible tooltips, with a long-hover override

Requirements: each tooltip becomes individually dismissible via a small × inside the bubble; the dismissal persists in `localStorage`; a >1s continuous hover/focus reshows a dismissed tooltip anyway (a "temporary reshow only" — the dismissal itself isn't undone by this, only by explicitly clicking × again... which is moot since it's already cleared, or by the new site-wide restore button); and clicking × hides the tooltip immediately, even though the pointer is still physically over it at that instant. A companion component, `RestoreTooltips` (see [RESTORE-TOOLTIPS.md](RESTORE-TOOLTIPS.md)), resets every dismissed tooltip at once.

### The reveal mechanism ended up pure CSS

The long-hover reshow needed no JS timer at all, via `transition-delay`:

```scss
.tooltip-trigger:hover + .tooltip.tooltip--cleared,
.tooltip-trigger:focus + .tooltip.tooltip--cleared,
.tooltip.tooltip--cleared:hover,
.tooltip.tooltip--cleared:focus-within {
  transition-delay: $tooltip-long-hover-delay; // 1s, local to this file
  opacity: 1;
  visibility: visible;
}
```

A hover shorter than the delay never starts the opacity/visibility transition at all — the moment `:hover`/`:focus-within` stop matching, the target value simply reverts to its start point, so nothing shows and nothing needs cancelling in JS. Leaving always falls back to the base (unmatched) rule, which has no delay, so hiding is always instant. This is also why the cleared flag itself is never touched by hovering — only the dismiss button writes to storage.

One real gotcha: `prefers-reduced-motion: reduce` can't use the existing blanket `transition: none` override here — that would drop `transition-delay` too, making a cleared tooltip reveal _instantly_ on any hover for reduced-motion users, defeating the dwell requirement rather than just its animation. Fixed by zeroing only `transition-duration`, keeping `transition-delay`/`transition-property` intact — the gate still functions, it just snaps instead of fading once the delay elapses.

### Closing the gap between trigger and bubble

Trigger and bubble are real DOM siblings with genuine visual space between them (e.g. `.theme-toggle-tooltip` sits at `top: -2.5rem` above a `.theme-toggle` that starts at `top: 0`). Moving the pointer across that space can momentarily hover neither element, dropping out of the `:hover` chain mid-crossing — which matters here specifically because the dismiss button lives inside the bubble, so a user needs to be able to travel from the trigger into the bubble to reach it. Fixed with an invisible `::after` bridge on `.tooltip`, sized per-instance via a CSS custom property so it isn't a `Tooltip`-component concern:

```scss
// Tooltip/index.scss
&::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%; // starts at the bubble's own bottom edge, never overlaps its content
  height: var(--tooltip-bridge-reach, 0);
}
```

```scss
// ThemeToggle/index.scss, on .theme-toggle-tooltip
--tooltip-bridge-reach: 0.5rem;
```

Deliberately kept a little short of the true gap rather than exact — `.tooltip` stacks above `.theme-toggle` (`z-index: 1` vs. `auto`), so any overshoot here would sit on top of the toggle button and swallow its clicks. A tooltip placed _below_ its trigger instead would need the mirror version (`bottom: 100%`, height extending upward); not needed by any instance today.

Also had to drop the base rule's `pointer-events: none` — it's a chicken-and-egg trap: an element excluded from hit-testing can never register the hover that would turn it back on, and unlike `opacity`/`visibility` that exclusion flips instantly rather than being smoothed by the transition. `visibility: hidden` already fully excludes a truly-hidden tooltip from hit-testing/tab order on its own, so nothing else needed to gate pointer interaction.

### Storage: one key, not one per tooltip

`TOOLTIP_STORAGE_KEY = 'tooltip-cleared'` holds a single JSON array of dismissed ids (`["theme-toggle-tooltip"]`), rather than a `tooltip-cleared:<id>` key per tooltip as first drafted — proposed as a simplification once a second feature (the site-wide restore button) needed to enumerate every dismissed tooltip at once. One key turns that into a single `removeItem` instead of a `localStorage` key-prefix scan, while each `Tooltip` instance still tracks its own dismissal independently by checking whether its own `id` is present in the array. Read in a mount `useEffect` (not SSR-injected like theme — the bubble is hidden by default regardless of cleared state, so there's no flash-of-wrong-content risk the way theme has, and no `gatsby-ssr.ts` change was needed here). `TOOLTIP_RESTORE_EVENT`, dispatched by `RestoreTooltips`, is listened for in the same component so an already-mounted tooltip updates immediately without a page reload — see [RESTORE-TOOLTIPS.md](RESTORE-TOOLTIPS.md).

### Force-hiding on dismiss, despite still being hovered

Clicking × while the pointer is still over the dismiss button doesn't change the CSS target value — whichever rule matched before (uncleared+hover, or cleared+hover past the delay) and whichever matches immediately after (cleared+hover, itself gated by the delay) both still resolve to `opacity: 1; visibility: visible`, since the value doesn't change no transition fires, and the bubble would incorrectly stay visible until the pointer eventually left. Fixed with a small, explicit JS override — a `forceHidden` boolean applied as an inline `style` (which always wins over any external stylesheet rule, sidestepping a specificity fight):

```tsx
setCleared(true);
setForceHidden(true);
```

`forceHidden` clears on the _next_ genuine hover/focus of the trigger (`onMouseEnter`/`onFocus`, composed onto whatever handlers the caller's own trigger element already has, rather than clobbering them), or when the restore event fires. The tricky part: this component also refocuses the trigger after dismiss (see below), which fires the trigger's own `onFocus` _synchronously_ — indistinguishable, from that handler's perspective, from a genuine subsequent focus. A one-shot ref guard (`suppressNextTriggerFocusRef`) ignores exactly that one, programmatically-caused focus event, set immediately before calling `.focus()` and consumed the first time the handler runs. The mouse-based reset path (`onMouseEnter`) needs no such guard — `.focus()` never synthesizes a mouse event.

Dismissing also still returns focus to the trigger — the × is about to become unreachable again (tooltip suppresses), so focus shouldn't fall through to `<body>`. Walks the known Fragment-sibling DOM structure (`event.currentTarget.closest('.tooltip')?.previousElementSibling`) rather than adding a `ref` via `cloneElement`, which would otherwise clobber a caller's own `ref` on the trigger (`ThemeToggle` already has one, for its `aria-pressed`/facet logic).

#### Bug: force-hide must also kill the transition, not just the target value

The first version of `forceHidden` only set `opacity: 0; visibility: 'hidden'` inline — verified by a unit test asserting those two inline style values, which passed, but the tooltip still visibly stayed open for a second in an actual browser. jsdom (what the unit test runs against) never runs real CSS transitions, so it couldn't catch this.

The real mechanism: at the exact moment of the first dismiss, `cleared` and `forceHidden` both flip to `true` in the same render, while the bubble is still being hovered (the pointer hasn't moved). That means the element now matches `.tooltip.tooltip--cleared:hover` (§ above), which sets `transition-delay: $tooltip-long-hover-delay` (1s) in the stylesheet. Inline style beats that rule's `opacity`/`visibility` _declarations_ on specificity, so the target values do become `0`/`hidden` — but inline style wasn't setting `transition-delay` at all, so the _timing_ the browser uses to animate toward those new values still came from the matched stylesheet rule. And since `visibility` transitions to `hidden` only take effect at transition-end (not transition-start, unlike animating to `visible`), the bubble stayed fully visible for the whole 1s delay plus the transition duration on top.

Fixed by also setting `transition: 'none'` in the same inline `style` object whenever `forceHidden` is true — this discards whatever `transition-delay`/`transition-property` the currently-matched stylesheet rule would otherwise contribute, so the opacity/visibility jump is instant regardless of which rule matched at the moment of dismiss. A regression test was added for the inline style itself (`Tooltip/index.test.tsx`'s `'disables the transition on force-hide...'` case) — it can only assert the style attribute is present, not that hiding is actually instant in a real browser (jsdom's limitation, same as above), so this needs to stay covered by the manual/e2e verification pass too, not just this unit test.

#### Bug: lingering `:focus` after dismiss kept a later mouse-only long-hover stuck open

Found while fixing a failing e2e run, not during original development. Repro: dismiss via mouse click, move the pointer away, then hover the trigger again for >1s to force the "long-hover reshow" (§ above) — and leave. The bubble should hide the instant the pointer leaves (§ above: "leaving always falls back to the base, undelayed rule"), but stayed stuck open indefinitely instead.

Cause: dismiss returns real DOM focus to the trigger (§ above), and nothing ever blurs it afterwards — a mouse-only visit later still leaves the trigger sitting in a plain `:focus` state from that earlier dismiss. The reveal rules matched on `:focus` (not just `:hover`), so even once the pointer left and `:hover` stopped matching, the stale `:focus` from the unrelated earlier dismiss kept the rule matching, and the bubble never fell back to the unmatched (instant-hide) base rule.

Fixed by matching `:focus-visible` (and `:has(:focus-visible)` in place of `:focus-within`) instead of plain `:focus` in both reveal rules. `:focus-visible` reflects the browser's own input-modality heuristic rather than raw focus state: verified via an ad hoc Playwright script (`el.matches(':focus-visible')`) that a `.focus()` call made from within a mouse click handler — dismiss's exact case — resolves `:focus-visible` to `false`, while real `Tab`-driven focus (the keyboard-accessibility case these rules also need to keep working) resolves it to `true`. So a stale, mouse-click-induced focus no longer keeps the tooltip open, while genuine keyboard navigation still does. `:has()` support was confirmed against the Chromium build this repo's Playwright config actually runs (`e2e/tooltip.spec.ts:69`'s regression test) rather than assumed from caniuse alone.

### `role="tooltip"` kept, against WAI-ARIA APG guidance — explicit exception

The WAI-ARIA Authoring Practices reserve `role="tooltip"` for non-interactive, transient content, and specifically advise against nesting interactive elements (like this new dismiss button) inside it — assistive tech that treats `role="tooltip"` as read-only/transient may not expose a focusable descendant meaningfully via non-linear/virtual-cursor navigation, even though it remains linearly Tab-reachable regardless of role. This component keeps `role="tooltip"` anyway, **at the site owner's explicit direction** — a deliberate, acknowledged deviation for a small personal site, not a resolved tradeoff via a different pattern. `aria-describedby` on the trigger is unaffected either way, since it only requires the referenced element to contain descriptive text, not carry that specific role.

## Files changed

- `src/components/Tooltip/index.tsx` — `cleared`/`forceHidden` state, the dismiss button + handler, the `TOOLTIP_RESTORE_EVENT` listener, `TOOLTIP_STORAGE_KEY`/`TOOLTIP_RESTORE_EVENT` exports.
- `src/components/Tooltip/index.scss` — the `transition-delay` reveal, the `::after` bridge, dismiss-button styling, the narrowed `prefers-reduced-motion` override, `pointer-events: none` removed.
- `src/components/Tooltip/index.test.tsx` — dismiss/persistence/restore/force-hide coverage.
- `src/components/ThemeToggle/index.scss` — `--tooltip-bridge-reach` added to `.theme-toggle-tooltip`.
- `src/components/RestoreTooltips/` (new) — see [RESTORE-TOOLTIPS.md](RESTORE-TOOLTIPS.md).
- `src/components/Layout/index.tsx` — renders `RestoreTooltips`.
- `e2e/tooltip.spec.ts` (new) — dismiss-persists-across-reload, storage isolation across a fresh context, long-vs-short hover reshow, leaving after a reshow re-suppresses without un-clearing, the trigger→bubble crossing doesn't flicker (validates the bridge in a real browser), keyboard reachability, and the restore button.

## Verification status

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` — all clean; 29 unit/component tests passing.
- `npm run test:e2e` — all clean; 15 e2e tests passing (including the `:focus-visible` fix above, added as its own regression case at `e2e/tooltip.spec.ts:69`).
- `npm run test:coverage` / `npm run test:e2e:coverage` — both above the 80% threshold (Tooltip's own branch coverage is 83–90%, short of 100% only on defensive `localStorage`-unavailable `catch` branches that aren't exercised by either suite).

## Section-wide dismissal via `onDismiss`/`dismissTooltips` (2026-08-09)

Requirement, from the Skills expandable-sub-items feature (see [SKILLS.md](SKILLS.md)): dismissing (×) any one of several related tooltips (every expandable skill's "Click for more info" hint) should dismiss all of them at once — narrower than `RestoreTooltips`' existing site-wide, unscoped restore (which also goes the opposite direction: it un-dismisses, this dismisses), and with no existing mechanism for a caller to dismiss an arbitrary subset.

Rather than adding a `group`/section prop to `Tooltip` itself, extended it symmetrically with the same shape the restore flow already uses — an id array plus a broadcast event — since the caller (`Skills`) already knows exactly which ids it owns and needs no extra abstraction to express that:

```ts
export const TOOLTIP_DISMISS_EVENT = 'tooltips:dismiss';

export const dismissTooltips = (ids: string[]): void => {
  try {
    const clearedIds = readClearedIds();
    const merged = [...new Set([...clearedIds, ...ids])];
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage unavailable — dismissal only lasts this page view
  }
  window.dispatchEvent(new CustomEvent(TOOLTIP_DISMISS_EVENT, { detail: { ids } }));
};
```

A new optional `onDismiss?: () => void` prop fires at the end of the existing `handleDismiss` (after that instance's own persist/state logic), letting a caller run `dismissTooltips(allRelatedIds)` in response to any one tooltip's own dismiss. A second `useEffect`, alongside the existing restore listener, checks `event.detail.ids.includes(id)` before clearing itself — so only tooltips whose id was actually passed to `dismissTooltips` respond, unlike the restore event which every mounted `Tooltip` responds to unconditionally. `ThemeToggle`'s tooltip (and any future unrelated one) is untouched by a Skills-scoped dismissal, since its id is never in that array — covered by a regression test asserting exactly that. Both the new prop and event are optional/backward compatible: existing callers that don't pass `onDismiss` are unaffected, and `RestoreTooltips`' full wipe-and-restore still resets these tooltips along with everything else.

## Exempted from the shared button base (`_buttons.scss`)

When a shared base look was added for every `<button>` in the app (see [../LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s "A third shared partial: `_buttons.scss`"), `.tooltip__dismiss` was deliberately left out — it stays transparent/icon-only, with no background box and no paper/off-paper fill, since it already sits on top of `.tooltip`'s own `$wine` background and a colored keycap behind the `×` would read as an odd two-tone patch. It's excluded via `:not(:where(.tooltip__dismiss))` in `_buttons.scss` rather than a plain `:not(.tooltip__dismiss)` specifically because this button has its own unconditional `transform: translateY(-50%);` for vertical centering — a plain `:not()` exclusion adds its own specificity point and would have let the shared file's `:active` pushed-effect transform (a `scaleY` shrink) outrank and overwrite that centering transform on every click; `:where()` keeps the exclusion at zero added specificity so that can't happen. No code in this file changed.

## Escape-to-dismiss keyboard handler (August 2026)

Added `useEffect` (lines 119-145 in `index.tsx`) to listen for `keydown` events while the tooltip is shown (not previously dismissed). Pressing Escape:

1. Sets `cleared` and `forceHidden` to true (same as clicking the `×` button)
2. Persists the dismissal to `localStorage`
3. Fires the optional `onDismiss` callback

Mirrors `PrintOptions`' own Escape-to-close pattern and aligns with WAI-ARIA dialog expectations. The listener is wired only while shown (early return if `cleared`), keeping it efficient and avoiding stale event handlers on reshow. Tested in `e2e/tooltip.spec.ts:163`.
