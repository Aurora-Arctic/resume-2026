# Resume — Summary

Full implementation history: [claude-docs/transcripts/components/RESUME.md](../transcripts/components/RESUME.md)

- Wrapper component (`src/components/Resume`) that assembles the six resume section components (`Header`, `Summary`, `Skills`, `Experience`, `Projects`, `Education`) in reading order from a single `data: ResumeData` prop.
- Rendered by `src/pages/index.tsx` inside `Layout`; owns the one `.resume` container used for page-level layout.
- Currently a plain single-column `flex-direction: column` stack — the intended spot for a future sidebar/multi-column web layout, without moving any section component.
- Content comes from `src/data/resume.ts` (`resumeData`) — still placeholder values; each section's real content is filled in by later, individual tasks.
