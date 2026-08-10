import React, { type ReactElement } from 'react';
import { classNames } from '../../utils/classNames';
import BulletsEllipsis from '../BulletsEllipsis';
import type { ExperienceEntry } from '../../data/resume';
import './index.scss';

interface ExperienceProps {
  experience: ExperienceEntry[];
  hasPersonalProjects: boolean;
}

const MINIMAL_EXPERIENCE_LIMIT = 2;

const renderExperience = (
  entry: ExperienceEntry,
  index: number,
  className?: string,
): ReactElement => (
  <div
    className={classNames('resume-experience__row', className)}
    key={`${entry.company}-${entry.title}`}
    style={{ gridRow: index + 2 }}
  >
    <article className="resume-experience__entry">
      <h3>{entry.title}</h3>
      <p className="resume-experience__company">{entry.company}</p>
      <p className="resume-experience__meta">
        {entry.startDate} to {entry.endDate} &mdash; {entry.location}
      </p>
      {entry.summary && <p className="resume-experience__summary">{entry.summary}</p>}
      <ul className="print-hide-summary print-hide-minimal print-hide-application">
        {entry.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <BulletsEllipsis className="resume-experience__bullets-ellipsis" />
    </article>
  </div>
);

const Experience = ({ experience, hasPersonalProjects }: ExperienceProps): ReactElement => (
  <section className="resume-experience" aria-labelledby="experience-heading">
    <h2 id="experience-heading">Experience</h2>
    {experience.map((entry, index) => {
      const entryClassNames = classNames(
        index >= MINIMAL_EXPERIENCE_LIMIT && 'print-hide-minimal',
        index >= MINIMAL_EXPERIENCE_LIMIT && 'print-hide-application',
      );
      return renderExperience(entry, index, entryClassNames || undefined);
    })}
    {hasPersonalProjects && (
      <div
        className="resume-experience__row print-hide-application"
        style={{ gridRow: experience.length + 2 }}
      >
        <h3 className="resume-experience__personal-label">Personal Projects</h3>
      </div>
    )}
  </section>
);

export default Experience;
