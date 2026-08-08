# Experience — Summary

Full implementation history: [claude-docs/transcripts/components/EXPERIENCE.md](../transcripts/components/EXPERIENCE.md)

- Renders reverse-chronological work history from an `experience: ExperienceEntry[]` prop — each entry: company, title, location, start/end dates, and a bullet list.
- Each entry is an `<article>` with an `<h3>` of `{title} · {company}`, a meta line (`{location} — {startDate} to {endDate}`), and a `<ul>` of bullets.
- Fourth section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
