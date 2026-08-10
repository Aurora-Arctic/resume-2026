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
    github: 'https://github.com/janedoe/deploy-dashboard',
    bullets: ['Cut mean-time-to-detect for failed deploys in half.'],
    company: 'Acme Corp',
  },
];

describe('Projects', () => {
  it('renders each project with its name (linked), description, stack, and bullets', () => {
    render(<Projects projects={projects} companyOrder={['Acme Corp']} />);

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

  it('GitHub link has an accessible name', () => {
    render(<Projects projects={projects} companyOrder={['Acme Corp']} />);

    expect(screen.getByRole('link', { name: /View Deploy Dashboard on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/janedoe/deploy-dashboard',
    );
  });

  it('renders the project name as plain text when there is no link', () => {
    render(
      <Projects projects={[{ ...projects[0], link: undefined }]} companyOrder={['Acme Corp']} />,
    );

    expect(screen.queryByRole('link', { name: 'Deploy Dashboard' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Deploy Dashboard' })).toBeInTheDocument();
  });

  it('groups projects under their company in companyOrder order', () => {
    const grouped: ProjectEntry[] = [
      { ...projects[0], name: 'Second Job Project', company: 'Second Job' },
      { ...projects[0], name: 'First Job Project', company: 'First Job' },
    ];
    render(<Projects projects={grouped} companyOrder={['First Job', 'Second Job']} />);

    const headings = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);
    expect(headings).toEqual(['First Job Project', 'Second Job Project']);
  });

  it('renders Personal-company projects even when companyOrder omits Personal', () => {
    const personalProject: ProjectEntry = {
      ...projects[0],
      name: 'Side Project',
      company: 'Personal',
    };
    render(<Projects projects={[personalProject]} companyOrder={['Acme Corp']} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Side Project' })).toBeInTheDocument();
  });

  it('shows the project company only for linear layouts via a dedicated label', () => {
    render(<Projects projects={projects} companyOrder={['Acme Corp']} />);

    expect(screen.getByText('Acme Corp')).toHaveClass('resume-projects__company');
  });

  it('applies print-hide-summary/application to projects past the per-company summary limit (3)', () => {
    const manyProjects: ProjectEntry[] = [
      { ...projects[0], name: 'Project 1', company: 'Alma' },
      { ...projects[0], name: 'Project 2', company: 'Alma' },
      { ...projects[0], name: 'Project 3', company: 'Alma' },
      { ...projects[0], name: 'Project 4', company: 'Alma' },
    ];
    render(<Projects projects={manyProjects} companyOrder={['Alma']} />);

    const project1 = screen
      .getByRole('heading', { level: 3, name: 'Project 1' })
      .closest('article');
    const project2 = screen
      .getByRole('heading', { level: 3, name: 'Project 2' })
      .closest('article');
    const project3 = screen
      .getByRole('heading', { level: 3, name: 'Project 3' })
      .closest('article');
    const project4 = screen
      .getByRole('heading', { level: 3, name: 'Project 4' })
      .closest('article');

    expect(project1).not.toHaveClass('print-hide-summary');
    expect(project2).not.toHaveClass('print-hide-summary');
    expect(project3).not.toHaveClass('print-hide-summary');
    expect(project4).toHaveClass('print-hide-summary');
    expect(project4).toHaveClass('print-hide-application');
  });

  it('applies print-hide-minimal to projects past the per-company minimal limit (2)', () => {
    const manyProjects: ProjectEntry[] = [
      { ...projects[0], name: 'Project 1', company: 'Alma' },
      { ...projects[0], name: 'Project 2', company: 'Alma' },
      { ...projects[0], name: 'Project 3', company: 'Alma' },
      { ...projects[0], name: 'Project 4', company: 'Alma' },
    ];
    render(<Projects projects={manyProjects} companyOrder={['Alma']} />);

    const project1 = screen
      .getByRole('heading', { level: 3, name: 'Project 1' })
      .closest('article');
    const project2 = screen
      .getByRole('heading', { level: 3, name: 'Project 2' })
      .closest('article');
    const project3 = screen
      .getByRole('heading', { level: 3, name: 'Project 3' })
      .closest('article');
    const project4 = screen
      .getByRole('heading', { level: 3, name: 'Project 4' })
      .closest('article');

    expect(project1).not.toHaveClass('print-hide-minimal');
    expect(project2).not.toHaveClass('print-hide-minimal');
    expect(project3).toHaveClass('print-hide-minimal');
    expect(project4).toHaveClass('print-hide-minimal');
  });
});
