import React, { type ReactElement } from 'react';
import type { HeaderData } from '../../data/resume';
import './index.scss';

interface HeaderProps {
  data: HeaderData;
}

const Header = ({ data }: HeaderProps): ReactElement => (
  <header className="resume-header">
    <h1>{data.name}</h1>
    <p className="resume-header__title">{data.title}</p>
    <ul className="resume-header__contact">
      <li>{data.location}</li>
      <li>
        <a href={`mailto:${data.email}`}>{data.email}</a>
      </li>
      <li>{data.phone}</li>
      {data.links.map((link) => (
        <li key={link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      ))}
    </ul>
  </header>
);

export default Header;
