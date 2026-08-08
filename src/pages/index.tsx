import React, { type ReactElement } from 'react';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const IndexPage = (): ReactElement => (
  <Layout>
    <h1>Resume 2026</h1>
    <p>My resume is being built with Gatsby.</p>
    <p>Use this as the starting point for your personal resume site.</p>
  </Layout>
);

export default IndexPage;

export const Head = (): ReactElement => <Seo />;
