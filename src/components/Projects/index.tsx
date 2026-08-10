import React, { type ReactElement } from 'react';
import { classNames } from '../../utils/classNames';
import BulletsEllipsis from '../BulletsEllipsis';
import GithubIcon from '../GithubIcon';
import type { ProjectEntry } from '../../data/resume';
import Tooltip from '../Tooltip';
import './index.scss';

interface ProjectsProps {
  projects: ProjectEntry[];
  companyOrder: string[];
}

const SUMMARY_PROJECT_LIMIT = 3;
const MINIMAL_PROJECT_LIMIT = 2;
const MINIMAL_PERSONAL_PROJECT_LIMIT = 1;

const renderProject = (project: ProjectEntry, className?: string, index?: number): ReactElement => (
  <article className={classNames('resume-projects__entry', className)} key={project.name}>
    <div>
      <h3>{project.link ? <a href={project.link}>{project.name}</a> : project.name}</h3>
      {project.github && (
        <Tooltip
          id={`project-github-tooltip-${index}`}
          className="resume-projects-github-tooltip"
          content="GitHub repository"
        >
          <a href={project.github} className="resume-projects__github-link">
            <GithubIcon className="resume-projects__github-icon" />
          </a>
        </Tooltip>
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
    <BulletsEllipsis className="resume-projects__bullets-ellipsis" />
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
            const entryClassNames = classNames(
              itemIndex >= MINIMAL_PROJECT_LIMIT && 'print-hide-minimal',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-summary',
              itemIndex >= MINIMAL_PROJECT_LIMIT && 'print-hide-application',
              project.company === 'Uxiliary' && 'print-hide-minimal',
              project.company === 'Uxiliary' && 'print-hide-application',
            );

            return renderProject(project, entryClassNames || undefined, itemIndex);
          })}
        </div>
      ))}
      {personalItems.length > 0 && (
        <div className="resume-projects__group">
          {personalItems.map((project, itemIndex) => {
            const entryClassNames = classNames(
              itemIndex >= MINIMAL_PERSONAL_PROJECT_LIMIT && 'print-hide-minimal',
              itemIndex >= SUMMARY_PROJECT_LIMIT && 'print-hide-summary',
              itemIndex >= MINIMAL_PERSONAL_PROJECT_LIMIT && 'print-hide-application',
            );

            return renderProject(project, entryClassNames || undefined, itemIndex);
          })}
        </div>
      )}
    </section>
  );
};

export default Projects;
