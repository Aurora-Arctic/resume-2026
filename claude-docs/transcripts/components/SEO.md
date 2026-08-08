# Seo — Implementation Record

This document is a transcript of the work done around `src/components/Seo/index.tsx`. Split out from [LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s transcript, which covers the general page shell and the font-loading history `Seo` is unrelated to.

## Adding a meta description

A mobile PageSpeed Insights run against the deployed site flagged "Document does not have a meta description" alongside three other warnings (render-blocking/chained font requests, unused JavaScript — see [LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s transcript for those).

`Seo` already existed (rendering only `<title>` from `siteMetadata`) but had no test file and no `claude-docs` entry of its own, despite predating this change — both were added now rather than left missing, per this repo's per-component doc convention.

`gatsby-config.ts` already had `siteMetadata.description` set (`'My resume for 2026 built with Gatsby.'`) — it was just never queried or rendered anywhere. Extended `Seo`'s GraphQL query (`SeoSiteMetadata`) and its `SiteMetadataQuery` TypeScript interface to also select `description`, and render `<meta name="description" content={...} />` alongside the existing `<title>`. No prop-based override was added — both call sites (`src/pages/index.tsx`, `src/pages/404.tsx`) call `<Seo />` with no arguments, and a single static description is enough for a two-page static resume site; adding a per-page override would be speculative for a need that doesn't exist yet.

Added `src/components/Seo/index.test.tsx`, mocking `gatsby`'s `useStaticQuery`/`graphql` the same way `src/pages/404.test.tsx` mocks `Link`. First attempt asserted against the RTL render container (`container.querySelector('title')`) and failed — React 19 hoists `<title>`/`<meta>` rendered anywhere in the component tree straight into `document.head` rather than leaving them in place, so the test was rewritten to query `document` instead.

Verified: `npx vitest run src/components/Seo` passes (2 tests). `npm run typecheck`/`lint`/`format:check` clean.
