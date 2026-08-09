import React, { type ReactElement, useEffect, useState } from 'react';
import type { ContactLink, HeaderData } from '../../data/resume';
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

// `resumeData.header.links` marks "this same site" with a link to
// resume.marwynn.net (its production domain) — resolveLink below rewrites
// that one entry to wherever this build is actually running (read fresh per
// call, not cached at module scope, so it reflects GATSBY_SITE_URL set by
// .env.development/.env.production or netlify.toml's per-context overrides:
// localhost:8000 in development, staging.resume.marwynn.net on staging,
// resume.marwynn.net on main). It also — uniquely among links — carries an
// unlocked visitor's `?k=` key forward, since the portfolio site shares this
// page's contact-encryption scheme. See claude-docs/CONTACT-ENCRYPTION.md.
// Every other link renders as-is.
const OWN_DOMAIN_HOSTNAME = 'resume.marwynn.net';

const getSiteUrl = (): string => process.env.GATSBY_SITE_URL ?? 'http://localhost:8000';

const resolveLink = (link: ContactLink, key: string | null): ContactLink => {
  if (new URL(link.href).hostname !== OWN_DOMAIN_HOSTNAME) {
    return link;
  }
  const url = new URL(getSiteUrl());
  if (key) {
    url.searchParams.set('k', key);
  }
  return { label: url.host, href: url.toString() };
};

const Header = ({ data }: HeaderProps): ReactElement => {
  const [contact, setContact] = useState<DecryptedContact>({
    location: null,
    email: null,
    phone: null,
  });
  const [decryptKey, setDecryptKey] = useState<string | null>(null);

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
      .then(([location, email, phone]) => {
        setContact({ location, email, phone });
        setDecryptKey(key);
      })
      .catch(() => {
        setContact({ location: null, email: null, phone: null });
        setDecryptKey(null);
      });
  }, [data.location, data.email, data.phone]);

  return (
    <header className="resume-header">
      <h1>{data.name}</h1>
      <p className="resume-header__title">
        {data.title.split(' | ').map((line, index, lines) => (
          <React.Fragment key={line}>
            {line}
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
      {(contact.email || contact.phone) && (
        <ul className="resume-header__contact" aria-label="Contact details">
          {contact.email && (
            <li className="resume-header__contact__item">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          )}
          {contact.phone && (
            <li className="resume-header__contact__item resume-header__contact__item--phone">
              {contact.phone}
            </li>
          )}
          {contact.location && <li className="resume-header__contact__item">{contact.location}</li>}
        </ul>
      )}

      <ul className="resume-header__links" aria-label="Links">
        {data.links.map((link) => {
          const resolved = resolveLink(link, decryptKey);
          return (
            <li key={link.href}>
              <a href={resolved.href} rel="noreferrer">
                {resolved.label}
              </a>
            </li>
          );
        })}
      </ul>
    </header>
  );
};

export default Header;
