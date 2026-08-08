import React, { type ReactElement } from 'react';
import { graphql, useStaticQuery } from 'gatsby';

interface SiteMetadataQuery {
  site: {
    siteMetadata: {
      title: string;
      description: string;
    };
  };
}

const Seo = (): ReactElement => {
  const data = useStaticQuery<SiteMetadataQuery>(graphql`
    query SeoSiteMetadata {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `);

  return (
    <>
      <title>{data.site.siteMetadata.title}</title>
      <meta name="description" content={data.site.siteMetadata.description} />
    </>
  );
};

export default Seo;
