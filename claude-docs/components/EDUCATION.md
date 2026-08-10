# Education — Summary

Full implementation history: [claude-docs/transcripts/components/EDUCATION.md](../transcripts/components/EDUCATION.md)

- Renders an `education: EducationEntry[]` prop — each entry: institution, degree, location, start/end dates, and an optional `honor`.
- Each entry is an `<article>`: degree as `<h3>` (same size as Experience/Projects titles, both `h3`), then `institution — location` (or just `institution` when `location` is empty) as a larger italicized line via `resume-education__detail`, then `startDate to endDate` as meta, then an optional honor line (italic only, via `resume-education__honors`). The `__detail` class matches `Experience`'s company sizing but always shows (unlike Experience's company, which hides at desktop/grid print tiers). The honor line carries `print-hide-minimal` so it drops on the Minimal print tier.
- Last section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
