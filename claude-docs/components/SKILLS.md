# Skills — Summary

Full implementation history: [claude-docs/transcripts/components/SKILLS.md](../transcripts/components/SKILLS.md)

- Renders categorized technical skills from a `skills: SkillCategory[]` prop (each entry: `{ category: string; skills: string[] }`).
- Uses a `<dl className="resume-skills__groups">` — category as `<dt>`, a `<ul>`/`<li>` of individual skills as `<dd>`'s content. Laid out as a 3-column grid at `$breakpoint-desktop` on the web; single-column stacked below that breakpoint and always in print (per the site's standing print rule).
- Bullets are diamonds via an absolutely-positioned `li::before { content: '◆' }` (list's own `list-style` removed) rather than `::marker`, since `::marker`'s allowed-property list excludes positioning — `::before` was needed to nudge the glyph's vertical alignment. Colored `$wine-stained` in dark mode (default) / `$wine` in light mode — the same theme-split already used for links, since raw `$wine` is low-contrast against the dark card background. `dt` is bolder/larger (`font-weight: 500`, `1.125rem`, matching the site's `h4` rung) than `dd`'s inherited body text, to visually separate category labels from their skill lists.
- Placeholder categories in `src/data/resume.ts` are already tailored to a backend/serverless/DevEx profile (`Languages`, `Cloud & Infrastructure`, `CI/CD & Tooling`, `Frameworks & Libraries`) since the category labels are structural, not content — the actual skill items inside stay generic placeholders.
- Fifth section rendered by `Resume` (after Projects, before Education) — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
