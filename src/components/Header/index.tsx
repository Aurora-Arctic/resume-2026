import React, { type ReactElement, useEffect, useState } from 'react';
import type { HeaderData } from '../../data/resume';
import { decryptText } from '../../utils/crypto';
import './index.scss';

interface HeaderProps {
  data: HeaderData;
}

interface DecryptedContact {
  location: string | null;
  email: string | null;
  phone: string | null;
}

const Header = ({ data }: HeaderProps): ReactElement => {
  const [contact, setContact] = useState<DecryptedContact>({
    location: null,
    email: null,
    phone: null,
  });

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('k');
    if (!key) {
      return;
    }

    // A wrong/missing key throws (AES-GCM auth tag fails to verify) —
    // leave contact info hidden rather than surface ciphertext or an error.
    Promise.all([
      decryptText(data.location, key),
      decryptText(data.email, key),
      decryptText(data.phone, key),
    ])
      .then(([location, email, phone]) => setContact({ location, email, phone }))
      .catch(() => setContact({ location: null, email: null, phone: null }));
  }, [data.location, data.email, data.phone]);

  return (
    <header className="resume-header">
      <h1>{data.name}</h1>
      <p className="resume-header__title">{data.title}</p>
      <ul className="resume-header__contact">
        {contact.location && <li>{contact.location}</li>}
        {contact.email && (
          <li>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </li>
        )}
        {contact.phone && <li>{contact.phone}</li>}
        {data.links.map((link) => (
          <li key={link.href}>
            <a href={link.href} rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
};

export default Header;
