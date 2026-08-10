import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from '.';

describe('Layout', () => {
  it('renders the live-resume note with correct semantic structure', () => {
    render(<Layout>Test content</Layout>);

    const link = screen.getByRole('link', { name: /localhost:8000/ });
    expect(link).toHaveAttribute('href', expect.stringMatching(/localhost:8000/));
    expect(link.closest('p')).toHaveTextContent(
      'You can find an always updated version of this resume at',
    );
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  });
});
