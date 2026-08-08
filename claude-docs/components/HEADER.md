# Header — Summary

Full implementation history: [claude-docs/transcripts/components/HEADER.md](../transcripts/components/HEADER.md)

- Renders the resume's name/title/contact block from a `HeaderData` prop (typed in `src/data/resume.ts`).
- The person's name is now the page's `<h1>` — replaces the old `<h1>Resume 2026</h1>` site-title heading, matching the conventional resume pattern (name as primary heading, not the site name).
- Contact details (location, email as a `mailto:` link, phone, an arbitrary `links: ContactLink[]` for GitHub/LinkedIn/portfolio) render as a flat, wrapping list — no columns.
- First section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
