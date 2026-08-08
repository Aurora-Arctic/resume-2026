# Experience — Implementation Record

This document is a transcript of the work done around `src/components/Experience` — the work-history section. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Experience`.

## Why it exists

The core section of a technical resume per every source consulted (bridgeviewit.com and general search): reverse-chronological work history, one entry per role, each with a company/title/location/date-range header line and bullets following an "Action + Tech + Impact + Scope" pattern. Scaffolded now with one placeholder entry in `resumeData.experience` (`src/data/resume.ts`) so the real bullet-writing work (a separate task) has a working component to fill in.

## Current state

- `index.tsx`: takes `experience: ExperienceEntry[]`, maps each entry to an `<article>` inside a `<section aria-labelledby="experience-heading">` — `<h3>{title} · {company}</h3>`, an italic meta line, then a `<ul>` of `bullets`.
- `index.scss`: spacing between entries and the meta line only, no other visual treatment.
- `index.test.tsx`: renders one sample entry, asserts the composed `<h3>` text, the meta line, and a bullet all render.
