# Education — Summary

Full implementation history: [claude-docs/transcripts/components/EDUCATION.md](../transcripts/components/EDUCATION.md)

- Renders an `education: EducationEntry[]` prop — each entry: institution, degree, location, and start/end dates.
- Each entry is an `<article>` with the degree as `<h3>`, then two meta lines (institution/location, then dates).
- Last section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
