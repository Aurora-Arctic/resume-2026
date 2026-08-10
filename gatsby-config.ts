import type { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  siteMetadata: {
    title: "Marwynn Joynes' Resume",
    description:
      'Senior full-stack engineer and technical lead with a decade of design experience before moving into engineering. Led partner integrations and compliance-sensitive systems, including healthcare data exchange and PHI/PII sanitization pipelines. Architected serverless and CI/CD infrastructure, cutting CI runtime and cost by ~30%. Mentored engineers across the stack. Increasingly works with AI-assisted engineering tooling to ship faster without sacrificing quality.',
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
