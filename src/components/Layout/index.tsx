import React, { type ReactElement, type ReactNode } from 'react';
import BackgroundCredit from '../BackgroundCredit';
import RestoreTooltips from '../RestoreTooltips';
import ThemeToggle from '../ThemeToggle';
import './index.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps): ReactElement => (
  <main className="paper-chrome">
    <div className="paper-card">
      <ThemeToggle />
      {children}
      <BackgroundCredit />
    </div>
    <RestoreTooltips />
  </main>
);

export default Layout;
