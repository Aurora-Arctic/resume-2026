import React, { type ReactElement, useState } from 'react';
import { classNames } from '../../utils/classNames';
import Tooltip, { dismissTooltips } from '../Tooltip';
import type { SkillCategory, SkillEntry } from '../../data/resume';
import './index.scss';

interface SkillsProps {
  skills: SkillCategory[];
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const getSkillIds = (category: string, label: string): { subListId: string; tooltipId: string } => {
  const base = `${slugify(category)}-${slugify(label)}`;
  return { subListId: `${base}-sublist`, tooltipId: `${base}-tooltip` };
};

interface SkillItemProps {
  category: string;
  skill: SkillEntry;
  allTooltipIds: string[];
  className?: string;
}

const SkillItem = ({ category, skill, allTooltipIds, className }: SkillItemProps): ReactElement => {
  const [expanded, setExpanded] = useState(false);

  if (!skill.subItems || skill.subItems.length === 0) {
    return <li className={className || undefined}>{skill.label}</li>;
  }

  const { subListId, tooltipId } = getSkillIds(category, skill.label);

  return (
    <li
      className={classNames(
        'resume-skills__skill',
        'resume-skills__skill--expandable',
        expanded && 'resume-skills__skill--expanded',
        className,
      )}
    >
      <Tooltip
        id={tooltipId}
        content="Click for more info"
        className="resume-skills__skill-tooltip"
        onDismiss={() => dismissTooltips(allTooltipIds)}
      >
        <button
          type="button"
          className="resume-skills__skill-toggle"
          aria-expanded={expanded}
          aria-controls={subListId}
          onClick={() => setExpanded((value) => !value)}
        >
          {skill.label}
        </button>
      </Tooltip>
      <ul
        className="resume-skills__sub-list print-hide-summary print-hide-minimal print-hide-application"
        id={subListId}
        hidden={!expanded}
      >
        {skill.subItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </li>
  );
};

// Per-category skill counts shown on the Summary and Minimal print tiers —
// everything past these limits gets print-hide-summary/print-hide-minimal
// (see src/scss/_print.scss), same mechanism Skills' sub-lists and
// Experience's bullets already use to opt out of condensed tiers.
const SUMMARY_SKILL_LIMIT = 5;
const MINIMAL_SKILL_LIMIT = 2;

const Skills = ({ skills }: SkillsProps): ReactElement => {
  const tooltipIds = skills.flatMap((group) =>
    group.skills
      .filter((skill) => skill.subItems && skill.subItems.length > 0)
      .map((skill) => getSkillIds(group.category, skill.label).tooltipId),
  );

  return (
    <section className="resume-skills" aria-labelledby="skills-heading">
      <h2 id="skills-heading">Skills</h2>
      <dl className="resume-skills__groups">
        {skills.map((group) => (
          <div className="resume-skills__group" key={group.category}>
            <dt>{group.category}</dt>
            <dd>
              <ul>
                {group.skills.map((skill, index) => (
                  <SkillItem
                    key={skill.label}
                    category={group.category}
                    skill={skill}
                    allTooltipIds={tooltipIds}
                    className={classNames(
                      index >= MINIMAL_SKILL_LIMIT && 'print-hide-minimal',
                      index >= SUMMARY_SKILL_LIMIT && 'print-hide-summary',
                      index >= SUMMARY_SKILL_LIMIT && 'print-hide-application',
                    )}
                  />
                ))}
              </ul>
              {group.skills.length > SUMMARY_SKILL_LIMIT && (
                <span
                  className="resume-skills__truncate-ellipsis resume-skills__truncate-ellipsis--summary"
                  aria-hidden="true"
                >
                  &hellip;
                </span>
              )}
              {group.skills.length > SUMMARY_SKILL_LIMIT && (
                <span
                  className="resume-skills__truncate-ellipsis resume-skills__truncate-ellipsis--application"
                  aria-hidden="true"
                >
                  &hellip;
                </span>
              )}
              {group.skills.length > MINIMAL_SKILL_LIMIT && (
                <span
                  className="resume-skills__truncate-ellipsis resume-skills__truncate-ellipsis--minimal"
                  aria-hidden="true"
                >
                  &hellip;
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default Skills;
