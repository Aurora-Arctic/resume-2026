# Projects — Implementation Record

This document is a transcript of the work done around `src/components/Projects` — the technical-projects section. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Projects`.

## Why it exists and its placement

Search results (Teal, ResumeWorded, Zety) converged on: put Projects above Experience when projects are the primary qualification (students, career-changers, thin work history), and below Experience when there's a strong employment history to lead with. Since the user has a solid backend/serverless/DevEx background to lead with, `Projects` is scaffolded after `Experience`, useful for surfacing specific infra/tooling/OSS work that doesn't fit neatly under a job's day-to-day bullets.

## Current state

- `index.tsx`: takes `projects: ProjectEntry[]` (`name`, `description`, `stack: string[]`, optional `link`, `bullets: string[]`). Each entry is an `<article>` — `<h3>` wraps the name in an `<a>` when `link` is present, otherwise renders it as plain text; then description, a joined `stack` line, and a bullet `<ul>`.
- `index.scss`: entry spacing + italic stack line, matching `Experience`'s meta-line treatment.
- `index.test.tsx`: two cases — a full sample entry with a link (asserts the link's `href`, description, stack, and bullet), and the same entry with `link` removed (asserts no link renders and the name still appears as a plain `<h3>`).

## Grouped by job, row-aligned with Experience; Marwynn.net removed (2026-08-10)

User request: reorganize `Projects` so each project sits with the job it was done under, row-aligned with that job's entry in `Experience` (full subgrid design in [RESUME.md](RESUME.md)'s transcript), and remove the Marwynn.net entry entirely.

**Data model: new required `company: string` field on `ProjectEntry`.** There was previously no link at all between a project and a job. Confirmed mapping with the user (project → company, in original data order): FHIR-Based Insurance Partner API → Alma, Nike Super Bowl Halftime VR Experience → 14Four, Sanitized Data Pipeline → Alma, Automated CI/CD Pipeline → Alma, EDMO.com → Uxiliary, SumoLogic.com → Uxiliary, Design Bright → `'Personal'` (no associated job — the literal string `'Personal'` is the sentinel Resume/Experience/Projects all check for). Marwynn.net was deleted from `resumeData.projects` outright, not just excluded from a group — the user was explicit it should be gone, not merely unlinked.

**Grouping logic, and why it can't `.filter()` before mapping.** `Projects` takes a new `companyOrder: string[]` prop (the job company names, in `Experience`'s display order — computed once in `Resume/index.tsx` from `data.experience.map(e => e.company)`). Groups are built as `companyOrder.map(company => ({ company, items: projects.filter(p => p.company === company) }))`, deliberately _not_ `projects.filter(...).map(...)` first — mapping over `companyOrder` (not the projects) guarantees `groups[i]`'s row index always equals job `i`'s position in `Experience`, even in the hypothetical case a job ends up with zero matched projects (its group still renders, empty, preserving alignment). `Personal`-company projects are computed as a separate `personalItems` filter and, if non-empty, appended as one more group after all job groups at `gridRow: companyOrder.length + 2` — mirroring `Experience`'s own "Personal Projects" trailing row (see [EXPERIENCE.md](EXPERIENCE.md)'s transcript).

**No sub-heading per group — relies on row alignment alone,** per the user's explicit answer when asked ("no label needed, row position already shows the association"). Each group is a `.resume-projects__group` div (the grid/subgrid item, `gridRow: index + 2`) directly wrapping that job's `<article>` entries with otherwise-unchanged markup.

**Follow-up mid-task request: show the company inline when the layout is linear (not grid).** Once the side-by-side grid landed, the user pointed out the row-alignment-only approach only works when the grid is actually active — below `$breakpoint-desktop` and in the Application print tier, `Experience` and `Projects` both collapse to independent single columns with no shared rows, so the job association silently disappears. Fix: each project's `<article>` unconditionally renders a `<p className="resume-projects__company">{project.company}</p>` (via a small shared `renderProject` helper, since it's now called from both the per-job-group map and the Personal group), styled `display: none` on desktop (`$breakpoint-desktop` min-width) and in `grid-print-tiers` (Full/Summary/Minimal), left visible by default — which resolves to mobile and the Application print tier, the two layouts that actually need it. Verified via computed-style checks at a print-emulation viewport narrower than `$breakpoint-desktop` (the project's own convention — Playwright's `emulateMedia({ media: 'print' })` still resolves `min-width` queries against the CSS _viewport_, not the physical `@page` size a real print job uses, so testing at a viewport at or above 1024px produces a false "hidden in Application too" result; see [RESUME.md](RESUME.md)'s `.resume`-level comment for the same caveat applied to layout more broadly).

## Print-tier trimming: hide bullets in Summary/Minimal/Application, hide stack in Minimal, add per-project summary (2026-08-10)

User request: bring the `Projects` section in line with the resume's existing print-tier trimming (like `Experience` and `Skills`), by hiding the bullets list and tech stack in condensed print tiers, and adding an optional two-sentence `summary` field (like `Experience.summary`) to condense each project to its essence for Summary/Minimal/Application tiers.

**Data model: new optional `summary?: string` field on `ProjectEntry`.** Mirrors `ExperienceEntry.summary`; two-sentence condensed prose synthesized from that project's `description`, `stack`, and `bullets` — e.g. "Ran serverless AWS infrastructure for a live Super Bowl VR activation... Added multi-region fallbacks and monitoring to catch issues before they became outages." The field is populated for all 9 projects, shown only on Summary/Minimal/Application tiers (replacing the full bullets list as a stand-in).

**Print-hide classes and ellipsis stand-ins.** Following the codebase's established convention (every existing `print-hide-*` site — `Experience.__bullets-ellipsis`, `Skills.__sub-list-ellipsis`), each hidden element gets a small "…" cue in the condensed tiers:

- Bullets `<ul>` gets `className="print-hide-summary print-hide-minimal print-hide-application"` (hidden on all three condensed tiers, shown only in Full), with an after-cue span `.resume-projects__bullets-ellipsis` (shows on Summary/Minimal/Application, styled wine-colored bold).
- Tech stack `<p>` gets `className="print-hide-minimal"` (hidden on Minimal only), with its own after-cue span `.resume-projects__stack-ellipsis` (shows on Minimal, styled wine-colored bold).
- The summary `<p>` renders unconditionally when `project.summary` is truthy, but styled `display: none` by default and only shown on Summary/Minimal/Application tiers via `html[data-print-mode='summary'|'minimal'|'application'] &`.

All three ellipsis/summary styles follow the existing pattern from `Experience` and `Skills` (see [EXPERIENCE.md](EXPERIENCE.md) and [SKILLS.md](SKILLS.md) transcripts).

## Project count truncation per company per print tier (2026-08-10)

User request: condense the `Projects` section by limiting the number of projects shown _per company_ in condensed print tiers. Summary and Application tiers show only the top 3 projects per company; Minimal shows top 2 per company. Full tier shows all projects (current behavior). This mirrors the existing approach used by `Skills` (top 5 per category in Summary/Application, top 2 in Minimal) and follows how `Experience` hides bullets in condensed tiers.

**Per-company limits, not global.** The truncation is applied _within each company group independently_, using the project's position within that group's array as the rank. E.g., if Alma has 4 projects, Summary tier shows the first 3; Minimal shows the first 2. If another company has only 2 projects, all 2 show in every tier. This is simpler than a global ranking and aligns with the component's natural structure: each company already has its own `.resume-projects__group` div, so applying the limit per group is natural and scales predictably as the data changes.

**Implementation: simple per-group index check.** The component tracks `itemIndex` (position within each group's array) as it maps. Each project gets `.print-hide-minimal` if `itemIndex >= MINIMAL_PROJECT_LIMIT` (2), and `.print-hide-summary`/`.print-hide-application` if `itemIndex >= SUMMARY_PROJECT_LIMIT` (3). The Personal group is handled separately with the same logic, so both company groups and the Personal group respect their own per-group limits.

**Tests.** Unit tests: render a company with 4+ projects and verify the first 3 lack `.print-hide-summary`, the 4th+ have it; first 2 lack `.print-hide-minimal`, 3rd+ have it. E2E tests: after simulating tiers via PrintOptions modal, assert that hidden projects exist (`.print-hide-minimal/summary/application` count > 0).

## Application tier bullets-ellipsis now grayscale (2026-08-10)

Correction: the `.resume-projects__bullets-ellipsis` (shown on Summary/Minimal/Application tiers when the full bullets list is hidden) now uses `$print-text` (dark gray) in the Application tier instead of `$wine`. Summary and Minimal tiers still use `$wine`. See commit `bb50fc4` and `claude-docs/components/PRINT-OPTIONS.md`'s grayscale entry for the broader Application-tier color shift.
