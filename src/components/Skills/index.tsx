import React, { type ReactElement } from 'react';
import type { SkillCategory } from '../../data/resume';
import './index.scss';

interface SkillsProps {
  skills: SkillCategory[];
}

const Skills = ({ skills }: SkillsProps): ReactElement => (
  <section className="resume-skills" aria-labelledby="skills-heading">
    <h2 id="skills-heading">Skills</h2>
    <dl>
      {skills.map((group) => (
        <div className="resume-skills__group" key={group.category}>
          <dt>{group.category}</dt>
          <dd>{group.skills.join(', ')}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export default Skills;
