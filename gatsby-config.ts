import type { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  siteMetadata: {
    title: "Marwynn Joynes' Resume",
    description: 'My resume for 2026 built with Gatsby.',
    // localhost:8000 in development, staging.resume.marwynn.net on staging,
    // resume.marwynn.net on main — set via GATSBY_SITE_URL (.env.development
    // / .env.production locally, netlify.toml's per-context overrides in
    // deploys) rather than hardcoded, so Header's self-link/key-propagation
    // (see claude-docs/CONTACT-ENCRYPTION.md) always points at wherever this
    // build actually runs.
    siteUrl: process.env.GATSBY_SITE_URL ?? 'http://localhost:8000',
  },
  plugins: [
    {
      resolve: `gatsby-plugin-sass`,
    },
  ],
};

export default config;
