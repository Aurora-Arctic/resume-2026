import React, { type ReactElement } from 'react';
import type { ProjectEntry } from '../../data/resume';
import './index.scss';

interface ProjectsProps {
  projects: ProjectEntry[];
  companyOrder: string[];
}

const renderProject = (project: ProjectEntry): ReactElement => (
  <article className="resume-projects__entry" key={project.name}>
    <h3>{project.link ? <a href={project.link}>{project.name}</a> : project.name}</h3>
    <p className="resume-projects__company">{project.company}</p>
    <p>{project.description}</p>
    {project.summary && <p className="resume-projects__summary">{project.summary}</p>}
    <p className="resume-projects__stack print-hide-minimal">{project.stack.join(', ')}</p>
    <span className="resume-projects__stack-ellipsis" aria-hidden="true">
      &hellip;
    </span>
    <ul className="print-hide-summary print-hide-minimal print-hide-application">
      {project.bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
    <span className="resume-projects__bullets-ellipsis" aria-hidden="true">
      &hellip;
    </span>
  </article>
);

const Projects = ({ projects, companyOrder }: ProjectsProps): ReactElement => {
  const groups = companyOrder.map((company) => ({
    company,
    items: projects.filter((project) => project.company === company),
  }));
  const personalItems = projects.filter((project) => project.company === 'Personal');

  return (
    <section className="resume-projects" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Projects</h2>
      {groups.map((group, index) => (
        <div className="resume-projects__group" key={group.company} style={{ gridRow: index + 2 }}>
          {group.items.map(renderProject)}
        </div>
      ))}
      {personalItems.length > 0 && (
        <div
          className="resume-projects__personal print-hide-application"
          style={{ gridRow: companyOrder.length + 2 }}
        >
          <h3 className="resume-projects__personal-heading">Personal Projects</h3>
          <div className="resume-projects__group">{personalItems.map(renderProject)}</div>
        </div>
      )}
    </section>
  );
};

export default Projects;
