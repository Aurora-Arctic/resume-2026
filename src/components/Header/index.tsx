import React, { type ReactElement, useEffect, useState } from 'react';
import type { ContactLink, HeaderData } from '../../data/resume';
import { decryptText } from '../../utils/crypto';
import { getSiteUrl } from '../../utils/site';
import GithubIcon from '../GithubIcon';
import Tooltip from '../Tooltip';
import './index.scss';

interface HeaderProps {
  data: HeaderData;
}

// FontAwesome (`@fortawesome/fontawesome-free`, a devDependency only — never
// imported as a runtime package/webfont) is used purely as a source for SVG
// path data, transcribed inline. Same convention as PrintOptions's PrintIcon
// and ThemeToggle's hand-built icons.

// Transcribed from node_modules/@fortawesome/fontawesome-free/svgs/brands/linkedin-in.svg
const LinkedinIcon: IconComponent = ({ className }) => (
  <svg className={className} viewBox="0 0 448 512" aria-hidden="true">
    <path
      fill="currentColor"
      d="M100.3 448l-92.9 0 0-299.1 92.9 0 0 299.1zM53.8 108.1C24.1 108.1 0 83.5 0 53.8 0 39.5 5.7 25.9 15.8 15.8s23.8-15.8 38-15.8 27.9 5.7 38 15.8 15.8 23.8 15.8 38c0 29.7-24.1 54.3-53.8 54.3zM447.9 448l-92.7 0 0-145.6c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7l0 148.1-92.8 0 0-299.1 89.1 0 0 40.8 1.3 0c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3l0 164.3-.1 0z"
    />
  </svg>
);

// Transcribed from node_modules/@fortawesome/fontawesome-free/svgs/solid/link.svg
const LinkIcon: IconComponent = ({ className }) => (
  <svg className={className} viewBox="0 0 576 512" aria-hidden="true">
    <path
      fill="currentColor"
      d="M419.5 96c-16.6 0-32.7 4.5-46.8 12.7-15.8-16-34.2-29.4-54.5-39.5 28.2-24 64.1-37.2 101.3-37.2 86.4 0 156.5 70 156.5 156.5 0 41.5-16.5 81.3-45.8 110.6l-71.1 71.1c-29.3 29.3-69.1 45.8-110.6 45.8-86.4 0-156.5-70-156.5-156.5 0-1.5 0-3 .1-4.5 .5-17.7 15.2-31.6 32.9-31.1s31.6 15.2 31.1 32.9c0 .9 0 1.8 0 2.6 0 51.1 41.4 92.5 92.5 92.5 24.5 0 48-9.7 65.4-27.1l71.1-71.1c17.3-17.3 27.1-40.9 27.1-65.4 0-51.1-41.4-92.5-92.5-92.5zM275.2 173.3c-1.9-.8-3.8-1.9-5.5-3.1-12.6-6.5-27-10.2-42.1-10.2-24.5 0-48 9.7-65.4 27.1L91.1 258.2c-17.3 17.3-27.1 40.9-27.1 65.4 0 51.1 41.4 92.5 92.5 92.5 16.5 0 32.6-4.4 46.7-12.6 15.8 16 34.2 29.4 54.6 39.5-28.2 23.9-64 37.2-101.3 37.2-86.4 0-156.5-70-156.5-156.5 0-41.5 16.5-81.3 45.8-110.6l71.1-71.1c29.3-29.3 69.1-45.8 110.6-45.8 86.6 0 156.5 70.6 156.5 156.9 0 1.3 0 2.6 0 3.9-.4 17.7-15.1 31.6-32.8 31.2s-31.6-15.1-31.2-32.8c0-.8 0-1.5 0-2.3 0-33.7-18-63.3-44.8-79.6z"
    />
  </svg>
);

interface DecryptedContact {
  location: string | null;
  email: string | null;
  phone: string | null;
}

type IconComponent = (props: { className: string }) => ReactElement;

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

// Icon selection reads the *original* (pre-resolveLink) href, matching the
// same hostname resolveLink itself checks against OWN_DOMAIN_HOSTNAME — the
// own-domain link's resolved href varies per environment (localhost:8000,
// staging.resume.marwynn.net, ...) and would otherwise defeat this match.
const getLinkIcon = (originalHref: string): ((props: { className: string }) => ReactElement) => {
  const hostname = new URL(originalHref).hostname;
  if (hostname === OWN_DOMAIN_HOSTNAME) return LinkIcon;
  if (hostname.includes('linkedin.com')) return LinkedinIcon;
  if (hostname.includes('github.com')) return GithubIcon;
  return LinkIcon;
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
              <a href={`tel:${contact.phone.replace(/\D/g, '')}`}>{contact.phone}</a>
            </li>
          )}
          {contact.location && <li className="resume-header__contact__item">{contact.location}</li>}
        </ul>
      )}

      <ul className="resume-header__links" aria-label="Links">
        {data.links.map((link, index) => {
          const resolved = resolveLink(link, decryptKey);
          const Icon = getLinkIcon(link.href);
          return (
            <li key={link.href}>
              <Tooltip
                id={`header-link-tooltip-${index}`}
                className="resume-header-link-tooltip"
                content={resolved.label}
              >
                <a href={resolved.href} rel="noreferrer" aria-label={resolved.label}>
                  <Icon className="resume-header__link-icon" />
                </a>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </header>
  );
};

export default Header;
