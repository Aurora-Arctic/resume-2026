# Summary — Summary

Full implementation history: [claude-docs/transcripts/components/SUMMARY.md](../transcripts/components/SUMMARY.md)

- Renders the resume's targeted-summary paragraph from a plain `summary: string` prop.
- Simplest of the six section components — no list/array to map over, just a heading + one paragraph.
- Includes a print-only note explaining that `…` (ellipsis) indicates truncated details are available online — rendered as `<h4 className="resume-summary__print-note">When a section has <strong>&hellip;</strong> at the end of it, that indicates there is more information available at <a href="...">{site host}</a></h4>`, using `getSiteUrl()` from the shared site utility to dynamically link to the current deployment environment's URL.
- In the Application print tier, any `<strong>` text inside the summary is forced to `$print-text` (dark gray) instead of wine/magenta, suitable for ATS submissions without color.
- Second section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
