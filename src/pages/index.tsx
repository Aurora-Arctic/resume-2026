import React, { type ReactElement } from 'react';
import '../scss/index.scss';

interface IndexPageProps {
  name?: string;
}

const IndexPage = ({ name = 'Marwynn Joynes' }: IndexPageProps): ReactElement => (
  <main className="page-shell">
    <div className="page-card">
      <h1 className="page-title">{name}'s Resume</h1>
      <p className="page-copy">My resume is being built with Gatsby.</p>
      <p className="page-copy">Use this as the starting point for your personal resume site.</p>
    </div>
  </main>
);

export default IndexPage;
