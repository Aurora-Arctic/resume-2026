import React, { type ReactElement } from 'react';
import './index.scss';

interface SummaryProps {
  summary: string;
}

const Summary = ({ summary }: SummaryProps): ReactElement => (
  <section className="resume-summary" aria-labelledby="summary-heading">
    <h2 id="summary-heading">Summary</h2>
    <p>{summary}</p>
  </section>
);

export default Summary;
