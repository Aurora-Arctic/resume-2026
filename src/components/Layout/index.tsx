import React, { type ReactElement, type ReactNode } from 'react';
import BackgroundCredit from '../BackgroundCredit';
import PrintOptions from '../PrintOptions';
import RestoreTooltips from '../RestoreTooltips';
import ThemeToggle from '../ThemeToggle';
import './index.scss';

interface LayoutProps {
  children: ReactNode;
}

// Mirrors Header's own getSiteUrl fallback (see src/components/Header/index.tsx)
// so this note points at the same domain the "this same site" contact link
// resolves to, without depending on that component.
const getSiteUrl = (): string => process.env.GATSBY_SITE_URL ?? 'http://localhost:8000';

const Layout = ({ children }: LayoutProps): ReactElement => {
  const siteUrl = new URL(getSiteUrl());

  return (
    <main className="paper-chrome">
      <div className="paper-card">
        <ThemeToggle />
        {children}
        <h4 className="paper-card__live-resume">
          You can find an always updated version of this resume at{' '}
          <a href={siteUrl.toString()}>{siteUrl.host}</a>
        </h4>
        <BackgroundCredit />
      </div>
      <PrintOptions />
      <RestoreTooltips />
    </main>
  );
};

export default Layout;
