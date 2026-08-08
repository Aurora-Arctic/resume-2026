# Seo — Summary

Full implementation history: [claude-docs/transcripts/components/SEO.md](../transcripts/components/SEO.md)

- `Seo` (`src/components/Seo`) reads `siteMetadata` (`gatsby-config.ts`) via `useStaticQuery` and renders `<title>` + `<meta name="description">`, both sourced from `siteMetadata.title`/`siteMetadata.description` — no props, no per-page override.
- Used as each page's Gatsby `Head` export (`export const Head = (): ReactElement => <Seo />;`) in both `src/pages/index.tsx` and `src/pages/404.tsx` — this is Gatsby's dedicated API for injecting `<head>` content per page, separate from `gatsby-ssr.ts`'s `onRenderBody` (used for site-wide `<head>` content like the theme-init script and, previously, font `<link>`s).
- React 19 hoists `<title>`/`<meta>` rendered anywhere in the tree straight into `document.head` — `index.test.tsx` queries `document.querySelector(...)`, not the render container, for exactly this reason.
