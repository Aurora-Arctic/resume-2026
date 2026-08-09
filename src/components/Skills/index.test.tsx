import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skills from '.';
import type { SkillCategory } from '../../data/resume';

const skills: SkillCategory[] = [
  { category: 'Languages', skills: ['TypeScript', 'Go'] },
  { category: 'Cloud & Infrastructure', skills: ['AWS Lambda', 'Terraform'] },
];

describe('Skills', () => {
  it('renders each skill category and its skills as a list', () => {
    render(<Skills skills={skills} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Cloud & Infrastructure')).toBeInTheDocument();

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('AWS Lambda')).toBeInTheDocument();
    expect(screen.getByText('Terraform')).toBeInTheDocument();

    expect(screen.queryByText('TypeScript, Go')).not.toBeInTheDocument();
  });

  it('renders each category as its own list', () => {
    render(<Skills skills={skills} />);

    expect(screen.getAllByRole('list')).toHaveLength(skills.length);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});
