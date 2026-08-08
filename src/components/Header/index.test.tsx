import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '.';
import type { HeaderData } from '../../data/resume';

const data: HeaderData = {
  name: 'Jane Doe',
  title: 'Backend Engineer',
  location: 'Remote',
  email: 'jane@example.com',
  phone: '555-0100',
  links: [{ label: 'github.com/janedoe', href: 'https://github.com/janedoe' }],
};

describe('Header', () => {
  it('renders the name as the primary heading and contact details', () => {
    render(<Header data={data} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByText('555-0100')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'jane@example.com' })).toHaveAttribute(
      'href',
      'mailto:jane@example.com',
    );
    expect(screen.getByRole('link', { name: 'github.com/janedoe' })).toHaveAttribute(
      'href',
      'https://github.com/janedoe',
    );
  });
});
