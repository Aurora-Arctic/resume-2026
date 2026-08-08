# RestoreTooltips — Summary

Full implementation history: [claude-docs/transcripts/components/RESTORE-TOOLTIPS.md](../transcripts/components/RESTORE-TOOLTIPS.md)

- A fixed "I Need Tooltips" button, rendered as a sibling of `.paper-card` (not inside it).
- Resets every individually-dismissed tooltip at once by clearing the shared `localStorage` key and dispatching a custom `window` event, so both mounted and unmounted tooltips update without a page reload.
- Uses the `$silver-oxide` color and is hidden in print, like other page chrome. Uses the shared `_buttons.scss` base.
