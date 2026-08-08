import React, { type ReactElement } from 'react';
import { graphql, useStaticQuery } from 'gatsby';

interface SiteMetadataQuery {
  site: {
    siteMetadata: {
      title: string;
    };
  };
}

const Seo = (): ReactElement => {
  const data = useStaticQuery<SiteMetadataQuery>(graphql`
    query SeoSiteMetadata {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return <title>{data.site.siteMetadata.title}</title>;
};

export default Seo;
