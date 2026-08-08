# Projects — Implementation Record

This document is a transcript of the work done around `src/components/Projects` — the technical-projects section. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Projects`.

## Why it exists and its placement

Search results (Teal, ResumeWorded, Zety) converged on: put Projects above Experience when projects are the primary qualification (students, career-changers, thin work history), and below Experience when there's a strong employment history to lead with. Since the user has a solid backend/serverless/DevEx background to lead with, `Projects` is scaffolded after `Experience`, useful for surfacing specific infra/tooling/OSS work that doesn't fit neatly under a job's day-to-day bullets.

## Current state

- `index.tsx`: takes `projects: ProjectEntry[]` (`name`, `description`, `stack: string[]`, optional `link`, `bullets: string[]`). Each entry is an `<article>` — `<h3>` wraps the name in an `<a>` when `link` is present, otherwise renders it as plain text; then description, a joined `stack` line, and a bullet `<ul>`.
- `index.scss`: entry spacing + italic stack line, matching `Experience`'s meta-line treatment.
- `index.test.tsx`: two cases — a full sample entry with a link (asserts the link's `href`, description, stack, and bullet), and the same entry with `link` removed (asserts no link renders and the name still appears as a plain `<h3>`).
