# Resume — Summary

Full implementation history: [claude-docs/transcripts/components/RESUME.md](../transcripts/components/RESUME.md)

- Wrapper component (`src/components/Resume`) that assembles the six resume section components (`Header`, `Summary`, `Skills`, `Experience`, `Projects`, `Education`) in reading order from a single `data: ResumeData` prop.
- Rendered by `src/pages/index.tsx` inside `Layout`; owns the one `.resume` container used for page-level layout.
- Mobile-first single-column `flex-direction: column` stack, in DOM order. At `$breakpoint-desktop` (`src/scss/_variables.scss`, 1024px — the project's first width-based breakpoint) `.resume` becomes a `grid-template-columns: 2fr 1fr` grid: `Header` and `Summary` share the first row via explicit `grid-column` placement (not the `order` property), so `Header` lands in the narrow right (1/3) column and `Summary` in the wide left (2/3) column while the DOM/reading order stays `Header` before `Summary` — only the visual position swaps. `Skills`/`Experience`/`Projects`/`Education` span both columns (`grid-column: 1 / -1`) and stay full-width below.
- Design rule: print must always render top-to-bottom, single-column — no exceptions. Web layout is free to use multiple columns. An explicit `@media print` block in `index.scss` resets `.resume` back to `display: flex; flex-direction: column` regardless of viewport width.
- Content comes from `src/data/resume.ts` (`resumeData`) — still placeholder values; each section's real content is filled in by later, individual tasks.
