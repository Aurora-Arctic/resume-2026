import React, { type ReactElement } from 'react';
import Layout from '../components/Layout';

const NotFoundPage = (): ReactElement => (
  <Layout>
    <h1>Page not found</h1>
    <p>The page you requested does not exist.</p>
  </Layout>
);

export default NotFoundPage;
