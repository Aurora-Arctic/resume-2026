import React, { type ReactElement } from 'react';
import type { ProjectEntry } from '../../data/resume';
import './index.scss';

interface ProjectsProps {
  projects: ProjectEntry[];
  companyOrder: string[];
}

const SUMMARY_PROJECT_LIMIT = 3;
const MINIMAL_PROJECT_LIMIT = 2;

const renderProject = (project: ProjectEntry, className?: string): ReactElement => (
  <article
    className={['resume-projects__entry', className].filter(Boolean).join(' ')}
    key={project.name}
  >
    <h3>{project.link ? <a href={project.link}>{project.name}</a> : project.name}</h3>
    <p className="resume-projects__company">{project.company}</p>
    <p className="print-hide-summary print-hide-minimal print-hide-application">
      {project.description}
    </p>
    {project.summary && <p className="resume-projects__summary">{project.summary}</p>}
    <p className="resume-projects__stack print-hide-minimal">{project.stack.join(', ')}</p>
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
          {group.items.map((project, itemIndex) => {
            const classNames = [
              itemIndex >= MINIMAL_PROJECT_LIMIT && 'print-hide-minimal',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-summary',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-application',
            ]
              .filter(Boolean)
              .join(' ');

            return renderProject(project, classNames || undefined);
          })}
        </div>
      ))}
      {personalItems.length > 0 && (
        <div className="resume-projects__group">
          {personalItems.map((project, itemIndex) => {
            const classNames = [
              itemIndex >= MINIMAL_PROJECT_LIMIT && 'print-hide-minimal',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-summary',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-application',
            ]
              .filter(Boolean)
              .join(' ');

            return renderProject(project, classNames || undefined);
          })}
        </div>
      )}
    </section>
  );
};

export default Projects;
