import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Summary from '.';

describe('Summary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the summary heading and paragraph', () => {
    render(<Summary summary="Backend engineer focused on serverless infra." />);

    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByText('Backend engineer focused on serverless infra.')).toBeInTheDocument();
  });

  it('links the print-only truncation note to GATSBY_SITE_URL, with the protocol stripped from its label', () => {
    vi.stubEnv('GATSBY_SITE_URL', 'https://resume.marwynn.net');
    render(<Summary summary="Backend engineer focused on serverless infra." />);

    const link = screen.getByRole('link', { name: 'resume.marwynn.net' });
    expect(link).toHaveAttribute('href', 'https://resume.marwynn.net/');
    expect(link.closest('p')).toHaveTextContent(
      'When a section has … at the end of it, that indicates there is more information available at resume.marwynn.net',
    );
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  });

  it('falls back to localhost:8000 for the print-only note when GATSBY_SITE_URL is unset, as in local development', () => {
    render(<Summary summary="Backend engineer focused on serverless infra." />);

    expect(screen.getByRole('link', { name: 'localhost:8000' })).toHaveAttribute(
      'href',
      'http://localhost:8000/',
    );
  });
});
