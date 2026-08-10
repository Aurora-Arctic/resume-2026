# Tooltip — Summary

Full implementation history: [claude-docs/transcripts/components/TOOLTIP.md](../transcripts/components/TOOLTIP.md)

- Generic, accessible `Tooltip`: `role="tooltip"` + `aria-describedby`, rendered as a sibling `Fragment` alongside its trigger — not a nested child, since the trigger's `clip-path` clips a nested tooltip.
- Individually dismissible via a `×` inside the bubble, persisted to `localStorage`; restorable site-wide via `RestoreTooltips`. That `×` button carries `className="dismiss-button tooltip__dismiss"` — `.dismiss-button` (`src/scss/_buttons.scss`) supplies the shared shape (flex-centered, transparent, hover/focus opacity dip, focus ring) also used by `PrintOptions`' own dismiss `×`; `.tooltip__dismiss` itself only sets this instance's position/size/font-size.
- An optional `onDismiss` prop fires after a tooltip's own dismiss completes; combined with the exported `dismissTooltips(ids)` helper (persists every id in one write, broadcasts `TOOLTIP_DISMISS_EVENT` with `{ ids }`, and any mounted `Tooltip` whose own `id` is in that list clears itself), a caller can fan one dismissal out to a whole group of related tooltips — e.g. Skills' expandable-skill hints — without `Tooltip` needing a `group`/section concept of its own. Mirrors the existing unscoped `TOOLTIP_RESTORE_EVENT` shape, just id-filtered instead of all-or-nothing.
- A >1s hover/focus reshows a dismissed tooltip anyway — the reveal delay is pure CSS `transition-delay`, no JS timer.
- Force-hide also kills any in-flight CSS transition; guards against stale `:focus` vs `:focus-visible` state leaving a tooltip stuck open.
- Deliberately keeps `role="tooltip"` despite APG guidance against nesting an interactive element inside it, per explicit site-owner direction.
