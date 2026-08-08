# Resume — Implementation Record

This document is a transcript of the work done around `src/components/Resume` — the wrapper that assembles the resume's six section components.

## Why it exists

The site previously rendered only placeholder heading/copy directly in `src/pages/index.tsx`. Scaffolding the actual resume sections (Header, Summary, Skills, Experience, Projects, Education — content still to be filled in per-section in later tasks) needed one place to assemble them in order and own the page-level container, rather than having `index.tsx` import and arrange six components directly. `Resume` is that place.

Section order and the section set follow current (2026) technical-resume industry advice, cross-checked against the user-supplied [bridgeviewit.com guide](https://www.bridgeviewit.com/blog/technical-resume-writing-tips/) plus web search on ATS and backend/DevOps-flavored resume conventions: Header/contact → Summary → Skills (grouped by category) → Experience (reverse-chronological) → Projects (placed after Experience — appropriate for a candidate with a solid work history, rather than leading with projects to compensate for a thin one) → Education.

## Data model decision

Content is driven by one central typed data file, `src/data/resume.ts`, rather than each section component hardcoding its own placeholder JSX or importing its own data slice directly. `Resume` takes the whole `ResumeData` object as a prop and hands each section its own slice — keeps the section components pure/presentational and testable in isolation, and later "fill out this section" tasks become data edits rather than component-code edits.

## Layout-flexibility decision

Explicit requirement: keep the print layout a single simple column (standard ATS advice — no tables/text-boxes/multi-column for the parseable form), but leave room for a richer multi-column/sidebar layout on the web view later. `Resume/index.scss` is deliberately minimal right now — `display: flex; flex-direction: column` — so a later task can turn it into a `grid` (e.g. a sidebar for Header/Skills/Education, main column for Summary/Experience/Projects) at a wider breakpoint without reshuffling which components render where. This also keeps print single-column for free: there's no grid/columns in the base styles to override inside `@media print`.

## Current state

- `index.tsx`: takes `data: ResumeData`, renders `<Header>`, `<Summary>`, `<Skills>`, `<Experience>`, `<Projects>`, `<Education>` in that order inside a `<div className="resume">`.
- `index.scss`: single-column flex stack, with a comment explaining the future-grid intent.
- `index.test.tsx`: renders with full sample data, asserts every section's heading is present.
- Rendered from `src/pages/index.tsx` as `<Resume data={resumeData} />` inside `Layout`, replacing the old placeholder `<h1>Resume 2026</h1>`/`<p>` copy.
