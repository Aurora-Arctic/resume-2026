import React, { type ReactElement } from 'react';
import { getSiteUrl } from '../../utils/site';
import './index.scss';

interface SummaryProps {
  summary: string;
}

const Summary = ({ summary }: SummaryProps): ReactElement => {
  const siteUrl = new URL(getSiteUrl());

  return (
    <section className="resume-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Summary</h2>
      <p>{summary}</p>
      <h4 className="resume-summary__print-note">
        When a section has <strong>&hellip;</strong> at the end of it, that indicates there is more
        information available at <a href={siteUrl.toString()}>{siteUrl.host}</a>
      </h4>
    </section>
  );
};

export default Summary;
