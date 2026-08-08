import React, { type ReactElement } from 'react';
import Layout from '../components/Layout';
import Resume from '../components/Resume';
import Seo from '../components/Seo';
import { resumeData } from '../data/resume';

const IndexPage = (): ReactElement => (
  <Layout>
    <Resume data={resumeData} />
  </Layout>
);

export default IndexPage;

export const Head = (): ReactElement => <Seo />;
