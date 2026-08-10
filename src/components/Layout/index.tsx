import React, { type ReactElement, type ReactNode } from 'react';
import { getSiteUrl } from '../../utils/site';
import BackgroundCredit from '../BackgroundCredit';
import PrintOptions from '../PrintOptions';
import RestoreTooltips from '../RestoreTooltips';
import ThemeToggle from '../ThemeToggle';
import './index.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps): ReactElement => {
  const siteUrl = new URL(getSiteUrl());

  return (
    <>
      <main className="paper-chrome">
        <div className="paper-card">
          <ThemeToggle />
          {children}
          <p className="paper-card__live-resume">
            You can find an always updated version of this resume at{' '}
            <a href={siteUrl.toString()}>{siteUrl.host}</a>
          </p>
          <BackgroundCredit />
        </div>
      </main>
      <PrintOptions />
      <RestoreTooltips />
    </>
  );
};

export default Layout;
