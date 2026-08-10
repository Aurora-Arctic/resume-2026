import React, { type ReactElement } from 'react';
import type { ExperienceEntry } from '../../data/resume';
import './index.scss';

interface ExperienceProps {
  experience: ExperienceEntry[];
  hasPersonalProjects: boolean;
}

const Experience = ({ experience, hasPersonalProjects }: ExperienceProps): ReactElement => (
  <section className="resume-experience" aria-labelledby="experience-heading">
    <h2 id="experience-heading">Experience</h2>
    {experience.map((entry, index) => (
      <div
        className="resume-experience__row"
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
          <ul className="print-hide-summary print-hide-minimal">
            {entry.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <span className="resume-experience__bullets-ellipsis" aria-hidden="true">
            &hellip;
          </span>
        </article>
      </div>
    ))}
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
