# Education — Implementation Record

This document is a transcript of the work done around `src/components/Education` — the education-history section. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Education`.

## Why it exists

Standard closing section on a technical resume per every source consulted, kept simple relative to `Experience`/`Projects` — no bullets, just institution/degree/location/dates. Scaffolded now with one placeholder entry in `resumeData.education` (`src/data/resume.ts`).

## Current state

- `index.tsx`: takes `education: EducationEntry[]`, maps each entry to an `<article>` — `<h3>{degree}</h3>`, then `{institution} — {location}` and `{startDate} to {endDate}` as separate meta paragraphs.
- `index.scss`: entry spacing only.
- `index.test.tsx`: renders one sample entry, asserts the degree heading and both meta lines render.
