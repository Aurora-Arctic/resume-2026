import React, { type ReactElement } from 'react';
import './index.scss';

const BackgroundCredit = (): ReactElement => (
  <p className="background-credit">
    Background pattern &ldquo;Prism&rdquo; by Michal, via{' '}
    <a href="https://www.toptal.com/designers/subtlepatterns/prism/" className="print-hide-url">
      Subtle Patterns
    </a>
    .
  </p>
);

export default BackgroundCredit;
