# Tooltip — Summary

Full implementation history: [claude-docs/transcripts/components/TOOLTIP.md](../transcripts/components/TOOLTIP.md)

- Generic, accessible `Tooltip`: `role="tooltip"` + `aria-describedby`, rendered as a sibling `Fragment` alongside its trigger — not a nested child, since the trigger's `clip-path` clips a nested tooltip.
- Individually dismissible via a `×` inside the bubble, persisted to `localStorage`; restorable site-wide via `RestoreTooltips`.
- A >1s hover/focus reshows a dismissed tooltip anyway — the reveal delay is pure CSS `transition-delay`, no JS timer.
- Force-hide also kills any in-flight CSS transition; guards against stale `:focus` vs `:focus-visible` state leaving a tooltip stuck open.
- Deliberately keeps `role="tooltip"` despite APG guidance against nesting an interactive element inside it, per explicit site-owner direction.
