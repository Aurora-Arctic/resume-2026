# Experience — Summary

Full implementation history: [claude-docs/transcripts/components/EXPERIENCE.md](../transcripts/components/EXPERIENCE.md)

- Renders reverse-chronological work history from an `experience: ExperienceEntry[]` prop plus a `hasPersonalProjects: boolean` prop — each entry: company, title, location, start/end dates, and a bullet list.
- Each entry is wrapped in a `.resume-experience__row` div (the CSS Grid item, placed at `gridRow: index + 2` and stretched to the full subgrid row height) containing the actual `<article>` — `<h3>{title} · {company}</h3>`, a meta line (`{location} — {startDate} to {endDate}`), and a `<ul>` of bullets.
- When `hasPersonalProjects` is true, a trailing `.resume-experience__row` renders a lightweight `<h3 className="resume-experience__personal-label">Personal Projects</h3>` (no dates/location/bullets) so the Projects column's "Personal" group has a row to align with.
- On desktop, each `.resume-experience__entry`/`.resume-experience__personal-label` is `position: sticky` and fades out (scroll-driven `animation-timeline`, feature-detected via `@supports`) just before it's pushed out by the next row — see [RESUME.md](RESUME.md) for the shared subgrid/sticky mechanics and why the timeline has to be named on a separate non-sticky row wrapper rather than self-referential `view()`.
- Fourth section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
