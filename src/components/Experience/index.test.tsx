import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Experience from '.';
import type { ExperienceEntry } from '../../data/resume';

const experience: ExperienceEntry[] = [
  {
    company: 'Acme Corp',
    title: 'Senior Backend Engineer',
    location: 'Remote',
    startDate: 'Jan 2022',
    endDate: 'Present',
    bullets: ['Migrated the deploy pipeline to GitHub Actions.'],
  },
];

describe('Experience', () => {
  it('renders each entry with its title, company, meta, and bullets', () => {
    render(<Experience experience={experience} hasPersonalProjects={false} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Senior Backend Engineer · Acme Corp' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Remote — Jan 2022 to Present')).toBeInTheDocument();
    expect(screen.getByText('Migrated the deploy pipeline to GitHub Actions.')).toBeInTheDocument();
  });

  it('renders a Personal Projects label when hasPersonalProjects is true', () => {
    render(<Experience experience={experience} hasPersonalProjects />);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Personal Projects' }),
    ).toBeInTheDocument();
  });

  it('omits the Personal Projects label when hasPersonalProjects is false', () => {
    render(<Experience experience={experience} hasPersonalProjects={false} />);

    expect(
      screen.queryByRole('heading', { level: 3, name: 'Personal Projects' }),
    ).not.toBeInTheDocument();
  });
});
