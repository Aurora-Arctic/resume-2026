import React, { type ReactElement, type ReactNode } from 'react';
import BackgroundCredit from '../BackgroundCredit';
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
  </main>
);

export default Layout;
