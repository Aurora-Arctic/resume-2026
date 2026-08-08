import React, { type ReactElement } from 'react';
import type { ExperienceEntry } from '../../data/resume';
import './index.scss';

interface ExperienceProps {
  experience: ExperienceEntry[];
}

const Experience = ({ experience }: ExperienceProps): ReactElement => (
  <section className="resume-experience" aria-labelledby="experience-heading">
    <h2 id="experience-heading">Experience</h2>
    {experience.map((entry) => (
      <article className="resume-experience__entry" key={`${entry.company}-${entry.title}`}>
        <h3>
          {entry.title} &middot; {entry.company}
        </h3>
        <p className="resume-experience__meta">
          {entry.location} &mdash; {entry.startDate} to {entry.endDate}
        </p>
        <ul>
          {entry.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </article>
    ))}
  </section>
);

export default Experience;
