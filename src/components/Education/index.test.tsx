import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Education from '.';
import type { EducationEntry } from '../../data/resume';

const education: EducationEntry[] = [
  {
    institution: 'State University',
    degree: 'B.S. Computer Science',
    location: 'Remote',
    startDate: '2014',
    endDate: '2018',
  },
];

describe('Education', () => {
  it('renders each entry with its degree, institution, location, and dates', () => {
    render(<Education education={education} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Education' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'B.S. Computer Science' }),
    ).toBeInTheDocument();
    expect(screen.getByText('State University — Remote')).toBeInTheDocument();
    expect(screen.getByText('2014 to 2018')).toBeInTheDocument();
  });
});
