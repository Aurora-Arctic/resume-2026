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
    summary: 'Modernized deploy tooling and infrastructure.',
  },
];

const experienceWithoutSummary: ExperienceEntry[] = [
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
      screen.getByRole('heading', { level: 3, name: 'Senior Backend Engineer' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Jan 2022 to Present — Remote')).toBeInTheDocument();
    expect(screen.getByText('Migrated the deploy pipeline to GitHub Actions.')).toBeInTheDocument();
  });

  it('renders the summary paragraph when present', () => {
    render(<Experience experience={experience} hasPersonalProjects={false} />);

    expect(screen.getByText('Modernized deploy tooling and infrastructure.')).toBeInTheDocument();
  });

  it('omits the summary paragraph when not present', () => {
    render(<Experience experience={experienceWithoutSummary} hasPersonalProjects={false} />);

    expect(
      screen.queryByText('Modernized deploy tooling and infrastructure.'),
    ).not.toBeInTheDocument();
  });

  it('opts the bullets list out of the Summary and Minimal print tiers', () => {
    render(<Experience experience={experience} hasPersonalProjects={false} />);

    expect(
      screen.getByText('Migrated the deploy pipeline to GitHub Actions.').closest('ul'),
    ).toHaveClass('print-hide-summary', 'print-hide-minimal');
  });

  it('renders a hidden wine ellipsis in place of the hidden bullets list', () => {
    render(<Experience experience={experience} hasPersonalProjects={false} />);

    const ellipsis = screen.getByText('…');
    expect(ellipsis).toHaveClass('resume-experience__bullets-ellipsis');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
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
