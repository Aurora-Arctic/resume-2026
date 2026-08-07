import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotFoundPage from './404';

// Gatsby's real <Link> depends on browser-runtime globals (window.___loader,
// IntersectionObserver-based prefetching) that only exist once Gatsby's own
// app bundle has run — absent in jsdom, so it's stubbed the same way the
// Gatsby docs recommend for Jest: https://www.gatsbyjs.com/docs/how-to/testing/unit-testing/#mocking-gatsby
vi.mock('gatsby', () => ({
  Link: ({ to, children }: { to: string; children?: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('NotFoundPage', () => {
  it('renders the not-found heading and copy', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('The page you requested does not exist.')).toBeInTheDocument();
  });

  it('links back to the home page', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});
