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

const manySkills: SkillCategory[] = [
  {
    category: 'Languages',
    skills: [
      { label: 'Python' },
      { label: 'JavaScript' },
      { label: 'SQL' },
      { label: 'HTML' },
      { label: 'CSS' },
      { label: 'PHP' },
      { label: 'Ruby' },
    ],
  },
  {
    category: 'Testing',
    skills: [{ label: 'Pytest' }, { label: 'Jest' }, { label: 'Playwright' }],
  },
  {
    category: 'AI Tools',
    skills: [{ label: 'Claude' }, { label: 'Co-Pilot' }],
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

  it('opts sub-items out of the Summary, Minimal, and Application print tiers', () => {
    render(<Skills skills={expandableSkills} />);

    expect(screen.getByText('ES').closest('ul')).toHaveClass(
      'print-hide-summary',
      'print-hide-minimal',
      'print-hide-application',
    );
  });

  it('renders a hidden wine ellipsis in place of each hidden sub-list', () => {
    render(<Skills skills={expandableSkills} />);

    const ellipses = screen.getAllByText('…');
    expect(ellipses).toHaveLength(2);
    ellipses.forEach((ellipsis) => {
      expect(ellipsis).toHaveClass('resume-skills__sub-list-ellipsis');
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('shows a "Click for more info" tooltip hint for expandable skills', () => {
    render(<Skills skills={expandableSkills} />);

    const tooltips = screen.getAllByRole('tooltip', { hidden: true });
    expect(tooltips).toHaveLength(2);
    tooltips.forEach((tooltip) => expect(tooltip).toHaveTextContent('Click for more info'));
  });

  it('opts skills past the 5th out of the Summary print tier', () => {
    render(<Skills skills={manySkills} />);

    const languagesList = screen.getByText('Python').closest('ul') as HTMLUListElement;
    const items = Array.from(languagesList.children);
    items.slice(0, 5).forEach((item) => expect(item).not.toHaveClass('print-hide-summary'));
    items.slice(5).forEach((item) => expect(item).toHaveClass('print-hide-summary'));
  });

  it('opts skills past the 2nd out of the Minimal print tier', () => {
    render(<Skills skills={manySkills} />);

    const languagesList = screen.getByText('Python').closest('ul') as HTMLUListElement;
    const items = Array.from(languagesList.children);
    items.slice(0, 2).forEach((item) => expect(item).not.toHaveClass('print-hide-minimal'));
    items.slice(2).forEach((item) => expect(item).toHaveClass('print-hide-minimal'));
  });

  it("does not truncate categories at or under a tier's own limit", () => {
    render(<Skills skills={manySkills} />);

    const aiToolsList = screen.getByText('Claude').closest('ul') as HTMLUListElement;
    Array.from(aiToolsList.children).forEach((item) => expect(item.className).toBe(''));
  });

  it('renders a wine ellipsis for a truncated category only on the tiers that actually hide something', () => {
    render(<Skills skills={manySkills} />);

    // Languages (7 skills) truncates on both Summary and Minimal.
    const languagesGroup = screen
      .getByText('Languages')
      .closest('.resume-skills__group') as HTMLElement;
    expect(
      languagesGroup.querySelector('.resume-skills__truncate-ellipsis--summary'),
    ).toBeInTheDocument();
    expect(
      languagesGroup.querySelector('.resume-skills__truncate-ellipsis--minimal'),
    ).toBeInTheDocument();

    // Testing (3 skills) only truncates on Minimal, not Summary.
    const testingGroup = screen
      .getByText('Testing')
      .closest('.resume-skills__group') as HTMLElement;
    expect(
      testingGroup.querySelector('.resume-skills__truncate-ellipsis--summary'),
    ).not.toBeInTheDocument();
    expect(
      testingGroup.querySelector('.resume-skills__truncate-ellipsis--minimal'),
    ).toBeInTheDocument();

    // AI Tools (2 skills) never truncates.
    const aiToolsGroup = screen
      .getByText('AI Tools')
      .closest('.resume-skills__group') as HTMLElement;
    expect(aiToolsGroup.querySelector('.resume-skills__truncate-ellipsis')).not.toBeInTheDocument();
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
