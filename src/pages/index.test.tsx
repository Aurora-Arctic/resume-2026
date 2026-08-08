import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IndexPage from './index';

describe('IndexPage', () => {
  it('renders the resume sections', () => {
    render(<IndexPage />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Education' })).toBeInTheDocument();
  });
});
