import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Summary from '.';

describe('Summary', () => {
  it('renders the summary heading and paragraph', () => {
    render(<Summary summary="Backend engineer focused on serverless infra." />);

    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByText('Backend engineer focused on serverless infra.')).toBeInTheDocument();
  });
});
