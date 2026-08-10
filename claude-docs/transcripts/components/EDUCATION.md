# Education — Implementation Record

This document is a transcript of the work done around `src/components/Education` — the education-history section. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Education`.

## Why it exists

Standard closing section on a technical resume per every source consulted, kept simple relative to `Experience`/`Projects` — no bullets, just institution/degree/location/dates. Scaffolded now with one placeholder entry in `resumeData.education` (`src/data/resume.ts`).

## Current state

- `index.tsx`: takes `education: EducationEntry[]`, maps each entry to an `<article>` — `<h3>{degree}</h3>`, then `{institution} — {location}` (or just `{institution}` when `location` is empty) and `{startDate} to {endDate}` as separate meta paragraphs, then an optional `{honor}` paragraph.
- `index.scss`: entry spacing, plus a `__detail` class shared by the institution and honor lines.
- `index.test.tsx`: renders one sample entry, asserts the degree heading, both meta lines, and the honor line render; also covers the no-honor and empty-location cases.

## 2026-08-10 — split degree/institution/honor into separate styled lines

The one placeholder entry (`resumeData.education[0]`) originally packed everything into a single `degree` string: `'Bachelor of Science (B.S.), Web Design and Development — Valedictorian'`, rendered as one `<h3>`. Restyled to read more like a normal degree/school layout and to match the visual language already established by `Experience`:

- `degree` trimmed to just `'Web Design and Development B.S.'` — an `<h3>`, so it's automatically the same size as Experience/Projects entry titles (all three share the global `h3` rule in `src/scss/_typography.scss`; no component-level override was ever added for any of them).
- `institution` (`'Full Sail University'`) now renders on its own line directly under the degree, styled with a new `resume-education__detail` class matching `Experience`'s `__company` sizing (`font-size: 1.125rem`, `margin: 0 0 0.75rem`, `font-weight: 300`) but without the bold. Unlike `Experience.__company`, the institution line has no `display: none` at the desktop breakpoint or grid print tiers — that hiding only makes sense for `Experience`/`Projects`, where the side-by-side grid conveys the company association redundantly; `Education` has no such grid, so the institution line always needs to show.
- Added an optional `EducationEntry.honor` field (`'Valedictorian'`) rendered as its own paragraph below the dates with a separate `resume-education__honors` class (`font-style: italic`). This prevents the honor from becoming bold or inheriting the institution's larger font size — it should stay text-sized and just italic as a distinguishing mark. The honor paragraph carries `print-hide-minimal` (the class from `src/scss/_print.scss`'s tier system, already used elsewhere e.g. `Experience`'s bullets list) so it disappears on the Minimal print tier along with other lower-priority detail, while still showing in Full/Summary/Application.
- The old `{institution} — {location}` line unconditionally rendered the mdash even though this entry's `location` has always been `''` (producing a dangling `"Full Sail University — "`). Made the separator conditional on a non-empty `location` while touching this line anyway.
- `endDate` simplified from `'August 2017'` to `'2017'` — the month wasn't adding anything the rest of the resume's date formatting does elsewhere (compare `Experience` entries, which use `'Month Year'` only for consistency needs, not because month granularity is required for an end-of-degree date).
