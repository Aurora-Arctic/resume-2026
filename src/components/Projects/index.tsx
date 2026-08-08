import React, { type ReactElement } from 'react';
import type { ProjectEntry } from '../../data/resume';
import './index.scss';

interface ProjectsProps {
  projects: ProjectEntry[];
}

const Projects = ({ projects }: ProjectsProps): ReactElement => (
  <section className="resume-projects" aria-labelledby="projects-heading">
    <h2 id="projects-heading">Projects</h2>
    {projects.map((project) => (
      <article className="resume-projects__entry" key={project.name}>
        <h3>{project.link ? <a href={project.link}>{project.name}</a> : project.name}</h3>
        <p>{project.description}</p>
        <p className="resume-projects__stack">{project.stack.join(', ')}</p>
        <ul>
          {project.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </article>
    ))}
  </section>
);

export default Projects;
