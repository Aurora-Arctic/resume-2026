import React, { type ReactElement } from 'react';
import { Link } from 'gatsby';
import Layout from '../components/Layout';

const NotFoundPage = (): ReactElement => (
  <Layout>
    <h1>Page not found</h1>
    <p>The page you requested does not exist.</p>
    <Link to="/">Back to home</Link>
  </Layout>
);

export default NotFoundPage;
