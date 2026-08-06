import type { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  siteMetadata: {
    title: "Marwynn's Resume",
    description: 'My resume for 2026 built with Gatsby.',
  },
  plugins: [
    {
      resolve: `gatsby-plugin-sass`,
    },
  ],
};

export default config;
