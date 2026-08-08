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
  it('renders each skill category and its skills', () => {
    render(<Skills skills={skills} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('TypeScript, Go')).toBeInTheDocument();
    expect(screen.getByText('Cloud & Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('AWS Lambda, Terraform')).toBeInTheDocument();
  });
});
