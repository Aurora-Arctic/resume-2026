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
    <p className="resume-projects__stack">{project.stack.join(', ')}</p>
    <ul>
      {project.bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
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
        <div className="resume-projects__group" style={{ gridRow: companyOrder.length + 2 }}>
          {personalItems.map(renderProject)}
        </div>
      )}
    </section>
  );
};

export default Projects;
