import React, { type ReactElement, type ReactNode } from 'react';
import BackgroundCredit from './BackgroundCredit';
import '../scss/layout.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps): ReactElement => (
  <main className="paper-chrome">
    <div className="paper-card">
      {children}
      <BackgroundCredit />
    </div>
  </main>
);

export default Layout;
