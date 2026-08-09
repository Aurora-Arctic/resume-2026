import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Skills from '.';
import { TOOLTIP_STORAGE_KEY } from '../Tooltip';
import type { SkillCategory } from '../../data/resume';

const skills: SkillCategory[] = [
  {
    category: 'Languages',
    skills: [{ label: 'TypeScript' }, { label: 'Go' }],
  },
  {
    category: 'Cloud & Infrastructure',
    skills: [{ label: 'AWS Lambda' }, { label: 'Terraform' }],
  },
];

const expandableSkills: SkillCategory[] = [
  {
    category: 'Languages',
    skills: [
      { label: 'JavaScript', subItems: ['ES', 'jQuery', 'TypeScript'] },
      { label: 'React', subItems: ['Next.js', 'Gatsby'] },
    ],
  },
];

describe('Skills', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it('renders a skill with no subItems as static text, not a button', () => {
    render(<Skills skills={skills} />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'TypeScript' })).not.toBeInTheDocument();
  });

  it('renders a skill with subItems as a collapsed, expandable button', () => {
    render(<Skills skills={expandableSkills} />);

    const toggle = screen.getByRole('button', { name: 'JavaScript' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('ES')).not.toBeVisible();
  });

  it('expands and collapses the sub-list on click', () => {
    render(<Skills skills={expandableSkills} />);

    const toggle = screen.getByRole('button', { name: 'JavaScript' });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('ES')).toBeVisible();
    expect(screen.getByText('jQuery')).toBeVisible();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('ES')).not.toBeVisible();
  });

  it('shows a "Click for more info" tooltip hint for expandable skills', () => {
    render(<Skills skills={expandableSkills} />);

    const tooltips = screen.getAllByRole('tooltip', { hidden: true });
    expect(tooltips).toHaveLength(2);
    tooltips.forEach((tooltip) => expect(tooltip).toHaveTextContent('Click for more info'));
  });

  it('dismissing one skill tooltip clears every other skill tooltip in the section', () => {
    render(<Skills skills={expandableSkills} />);

    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss tooltip' });
    fireEvent.click(dismissButtons[0]);

    const tooltips = screen.getAllByRole('tooltip', { hidden: true });
    tooltips.forEach((tooltip) => expect(tooltip).toHaveClass('tooltip--cleared'));

    const stored: unknown = JSON.parse(window.localStorage.getItem(TOOLTIP_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(
      expect.arrayContaining(['languages-javascript-tooltip', 'languages-react-tooltip']),
    );
  });
});
