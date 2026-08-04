import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFoundPage from './404';

describe('NotFoundPage', () => {
  it('renders the not-found heading and copy', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('The page you requested does not exist.')).toBeInTheDocument();
  });
});
