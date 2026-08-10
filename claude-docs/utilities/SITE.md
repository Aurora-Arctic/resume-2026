# site — Summary

Full implementation history: [claude-docs/transcripts/utilities/SITE.md](../transcripts/utilities/SITE.md)

- A utility module exporting `getSiteUrl(): string`.
- **Behavior:** Returns `process.env.GATSBY_SITE_URL` if set, otherwise falls back to `'http://localhost:8000'`.
- **Key property:** Read fresh on every call — **not cached** — so it reflects the current environment's `GATSBY_SITE_URL` value, which varies per build context: `localhost:8000` in development, `staging.resume.marwynn.net` on staging, `resume.marwynn.net` on main. See `gatsby-config.ts`'s `siteUrl`, `.env.development`/`.env.production`, and `netlify.toml`'s per-context overrides.
- Used by Header (to resolve the resume.marwynn.net self-link), Summary, and Layout (to set OpenGraph/Twitter meta tags correctly regardless of deployment environment).
- Extracted from triplicated verbatim definitions in Header, Summary, and Layout components. Consolidating eliminates duplication and makes the "read fresh per call" contract explicit.
