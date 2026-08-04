import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IndexPage from './index';

describe('IndexPage', () => {
  it('renders the resume heading and intro copy', () => {
    render(<IndexPage />);

    expect(screen.getByRole('heading', { name: 'Resume 2026' })).toBeInTheDocument();
    expect(screen.getByText('My resume is being built with Gatsby.')).toBeInTheDocument();
    expect(
      screen.getByText('Use this as the starting point for your personal resume site.'),
    ).toBeInTheDocument();
  });
});
