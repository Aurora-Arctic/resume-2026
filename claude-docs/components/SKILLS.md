# Skills — Summary

Full implementation history: [claude-docs/transcripts/components/SKILLS.md](../transcripts/components/SKILLS.md)

- Renders categorized technical skills from a `skills: SkillCategory[]` prop (each entry: `{ category: string; skills: string[] }`).
- Uses a `<dl>` — category as `<dt>`, comma-joined skill list as `<dd>` — stacked vertically, not a grid/columns.
- Placeholder categories in `src/data/resume.ts` are already tailored to a backend/serverless/DevEx profile (`Languages`, `Cloud & Infrastructure`, `CI/CD & Tooling`, `Frameworks & Libraries`) since the category labels are structural, not content — the actual skill items inside stay generic placeholders.
- Third section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
