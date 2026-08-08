import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Resume from '.';
import type { ResumeData } from '../../data/resume';

const data: ResumeData = {
  header: {
    name: 'Jane Doe',
    title: 'Backend Engineer',
    location: 'Remote',
    email: 'jane@example.com',
    phone: '555-0100',
    links: [],
  },
  summary: 'Backend engineer focused on serverless infra.',
  skills: [{ category: 'Languages', skills: ['TypeScript'] }],
  experience: [
    {
      company: 'Acme Corp',
      title: 'Senior Backend Engineer',
      location: 'Remote',
      startDate: 'Jan 2022',
      endDate: 'Present',
      bullets: ['Shipped things.'],
    },
  ],
  projects: [
    {
      name: 'Deploy Dashboard',
      description: 'Internal tool.',
      stack: ['TypeScript'],
      bullets: ['Did a thing.'],
    },
  ],
  education: [
    {
      institution: 'State University',
      degree: 'B.S. Computer Science',
      location: 'Remote',
      startDate: '2014',
      endDate: '2018',
    },
  ],
};

describe('Resume', () => {
  it('renders every section in order', () => {
    render(<Resume data={data} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Education' })).toBeInTheDocument();
  });
});
