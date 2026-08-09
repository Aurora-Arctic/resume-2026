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

const Resume = ({ data }: ResumeProps): ReactElement => (
  <div className="resume">
    <Header data={data.header} />
    <Summary summary={data.summary} />
    <Experience experience={data.experience} />
    <Projects projects={data.projects} />
    <Skills skills={data.skills} />
    <Education education={data.education} />
  </div>
);

export default Resume;
