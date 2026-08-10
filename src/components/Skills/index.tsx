import React, { type ReactElement, useState } from 'react';
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
}

const SkillItem = ({ category, skill, allTooltipIds }: SkillItemProps): ReactElement => {
  const [expanded, setExpanded] = useState(false);

  if (!skill.subItems || skill.subItems.length === 0) {
    return <li>{skill.label}</li>;
  }

  const { subListId, tooltipId } = getSkillIds(category, skill.label);

  return (
    <li
      className={[
        'resume-skills__skill',
        'resume-skills__skill--expandable',
        expanded && 'resume-skills__skill--expanded',
      ]
        .filter(Boolean)
        .join(' ')}
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
      <span className="resume-skills__sub-list-ellipsis" aria-hidden="true">
        …
      </span>
    </li>
  );
};

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
                {group.skills.map((skill) => (
                  <SkillItem
                    key={skill.label}
                    category={group.category}
                    skill={skill}
                    allTooltipIds={tooltipIds}
                  />
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default Skills;
