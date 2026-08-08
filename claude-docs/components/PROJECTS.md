# Projects — Summary

Full implementation history: [claude-docs/transcripts/components/PROJECTS.md](../transcripts/components/PROJECTS.md)

- Renders a `projects: ProjectEntry[]` prop — each entry: name, description, tech stack, optional link, and a bullet list.
- Project name renders as a link (`<a href={project.link}>`) when `link` is set, otherwise plain text — both cases render inside the same `<h3>`.
- Placed after `Experience` (not before) — appropriate for a candidate with a solid employment history rather than one leaning on projects to compensate for a thin one, per current resume-placement advice.
- Fifth section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
