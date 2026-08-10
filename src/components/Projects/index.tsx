import React, { type ReactElement } from 'react';
import type { ProjectEntry } from '../../data/resume';
import './index.scss';

const GithubIcon = (): ReactElement => (
  <svg className="resume-projects__github-icon" viewBox="0 0 512 512" aria-hidden="true">
    <path
      fill="currentColor"
      d="M216.5 362.5c-66-8-112.5-55.5-112.5-117 0-25 9-52 24-70-6.5-16.5-5.5-51.5 2-66 20-2.5 47 8 63 22.5 19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22 7 13.5 8 48.5 1.5 65.5 16 19 24.5 44.5 24.5 70.5 0 61.5-46.5 108-113.5 116.5 17 11 28.5 35 28.5 62.5l0 52C323 491.5 335.5 500 350.5 494 441 459.5 512 369 512 257 512 115.5 397 0 255.5 0S0 115.5 0 257c0 111 70.5 203 165.5 237.5 13.5 5 26.5-4 26.5-17.5l0-40c-7 3-16 5-24 5-33 0-52.5-18-66.5-51.5-5.5-13.5-11.5-21.5-23-23-6-.5-8-3-8-6 0-6 10-10.5 20-10.5 14.5 0 27 9 40 27.5 10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21z"
    />
  </svg>
);

interface ProjectsProps {
  projects: ProjectEntry[];
  companyOrder: string[];
}

const SUMMARY_PROJECT_LIMIT = 3;
const MINIMAL_PROJECT_LIMIT = 2;
const MINIMAL_PERSONAL_PROJECT_LIMIT = 1;

const renderProject = (project: ProjectEntry, className?: string): ReactElement => (
  <article
    className={['resume-projects__entry', className].filter(Boolean).join(' ')}
    key={project.name}
  >
    <div>
      <h3>{project.link ? <a href={project.link}>{project.name}</a> : project.name}</h3>
      {project.github && (
        <a
          href={project.github}
          className="resume-projects__github-link"
          aria-label="GitHub repository"
        >
          <GithubIcon />
        </a>
      )}
    </div>
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
              itemIndex >= MINIMAL_PROJECT_LIMIT && 'print-hide-application',
              project.company === 'Uxiliary' && 'print-hide-minimal',
              project.company === 'Uxiliary' && 'print-hide-application',
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
              itemIndex >= MINIMAL_PERSONAL_PROJECT_LIMIT && 'print-hide-minimal',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-summary',
              itemIndex >= MINIMAL_PERSONAL_PROJECT_LIMIT && 'print-hide-application',
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
