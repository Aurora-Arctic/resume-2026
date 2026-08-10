import React, { type ReactElement } from 'react';
import Education from '../Education';
import Experience from '../Experience';
import Header from '../Header';
import Projects from '../Projects';
import Skills from '../Skills';
import Summary from '../Summary';
import type { ResumeData } from '../../data/resume';
import './index.scss';

interface ResumeProps {
  data: ResumeData;
}

const Resume = ({ data }: ResumeProps): ReactElement => {
  const companyOrder = data.experience.map((entry) => entry.company);
  const hasPersonalProjects = data.projects.some((project) => project.company === 'Personal');
  const rowCount = 1 + data.experience.length + (hasPersonalProjects ? 1 : 0);

  return (
    <div className="resume">
      <Header data={data.header} />
      <Summary summary={data.summary} />
      <div
        className="resume-experience-projects"
        style={{ gridTemplateRows: `repeat(${rowCount}, auto)` }}
      >
        <Experience experience={data.experience} hasPersonalProjects={hasPersonalProjects} />
        <Projects projects={data.projects} companyOrder={companyOrder} />
      </div>
      <Education education={data.education} />
      <Skills skills={data.skills} />
    </div>
  );
};

export default Resume;
