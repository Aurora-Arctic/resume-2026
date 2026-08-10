# BulletsEllipsis — Summary

Full implementation history: [claude-docs/transcripts/components/BULLETS-ELLIPSIS.md](../transcripts/components/BULLETS-ELLIPSIS.md)

- A minimal presentational component rendering a print-tier truncation indicator (`<span aria-hidden="true">&hellip;</span>`).
- Takes a required `className: string` prop, applied to the `<span>` element — allows callers to control styling and BEM naming (e.g. `resume-experience__bullets-ellipsis`, `resume-projects__bullets-ellipsis`).
- `aria-hidden="true"` marks it as decorative, hidden from screen readers (the ellipsis is a visual signal only, not semantic content).
- No internal styling (`index.scss`) — styling lives entirely at the call site (e.g. `Experience/index.scss` defines `.resume-experience__bullets-ellipsis` with `@include ellipsis-ink`, same for Projects), keeping markup decoupled from presentation.
- Extracted from duplicated inline `<span>` definitions in Experience and Projects (identical structure, differing only in BEM block name).
