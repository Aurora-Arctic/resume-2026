import React, { type ReactElement, type ReactNode } from 'react';
import '../scss/layout.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps): ReactElement => (
  <main className="paper-chrome">
    <div className="paper-card">{children}</div>
  </main>
);

export default Layout;
