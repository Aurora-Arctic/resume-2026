import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Seo from '.';

vi.mock('gatsby', () => ({
  useStaticQuery: () => ({
    site: {
      siteMetadata: {
        title: "Marwynn Joynes' Resume",
        description: 'My resume for 2026 built with Gatsby.',
      },
    },
  }),
  graphql: () => '',
}));

describe('Seo', () => {
  // React 19 hoists <title>/<meta> rendered anywhere in the tree straight
  // into document.head, rather than leaving them in the render container.
  it('renders the site title from site metadata', () => {
    render(<Seo />);

    expect(document.querySelector('title')).toHaveTextContent("Marwynn Joynes' Resume");
  });

  it('renders a meta description from site metadata', () => {
    render(<Seo />);

    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'My resume for 2026 built with Gatsby.',
    );
  });
});
