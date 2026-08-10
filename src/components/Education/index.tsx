import React, { type ReactElement } from 'react';
import type { EducationEntry } from '../../data/resume';
import './index.scss';

interface EducationProps {
  education: EducationEntry[];
}

const Education = ({ education }: EducationProps): ReactElement => (
  <section className="resume-education" aria-labelledby="education-heading">
    <h2 id="education-heading">Education</h2>
    {education.map((entry) => (
      <article className="resume-education__entry" key={`${entry.institution}-${entry.degree}`}>
        <h3>{entry.degree}</h3>
        <p className="resume-education__detail">
          {entry.location ? `${entry.institution} — ${entry.location}` : entry.institution}
        </p>
        <p className="resume-education__meta">
          {entry.startDate} to {entry.endDate}
        </p>
        {entry.honor && (
          <p className="resume-education__honors print-hide-minimal">{entry.honor}</p>
        )}
      </article>
    ))}
  </section>
);

export default Education;
