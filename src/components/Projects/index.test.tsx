import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Projects from '.';
import type { ProjectEntry } from '../../data/resume';

const projects: ProjectEntry[] = [
  {
    name: 'Deploy Dashboard',
    description: 'Internal tool for tracking deploy health.',
    stack: ['TypeScript', 'AWS Lambda'],
    link: 'https://github.com/janedoe/deploy-dashboard',
    bullets: ['Cut mean-time-to-detect for failed deploys in half.'],
  },
];

describe('Projects', () => {
  it('renders each project with its name (linked), description, stack, and bullets', () => {
    render(<Projects projects={projects} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Deploy Dashboard' })).toHaveAttribute(
      'href',
      'https://github.com/janedoe/deploy-dashboard',
    );
    expect(screen.getByText('Internal tool for tracking deploy health.')).toBeInTheDocument();
    expect(screen.getByText('TypeScript, AWS Lambda')).toBeInTheDocument();
    expect(
      screen.getByText('Cut mean-time-to-detect for failed deploys in half.'),
    ).toBeInTheDocument();
  });

  it('renders the project name as plain text when there is no link', () => {
    render(<Projects projects={[{ ...projects[0], link: undefined }]} />);

    expect(screen.queryByRole('link', { name: 'Deploy Dashboard' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Deploy Dashboard' })).toBeInTheDocument();
  });
});
