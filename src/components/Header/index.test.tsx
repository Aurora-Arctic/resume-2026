import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Header from '.';
import type { HeaderData } from '../../data/resume';
import { encryptText } from '../../utils/crypto';

const KEY = 'test-key';

async function buildData(): Promise<HeaderData> {
  return {
    name: 'Jane Doe',
    title: 'Backend Engineer',
    location: await encryptText('Remote', KEY),
    email: await encryptText('jane@example.com', KEY),
    phone: await encryptText('555-0100', KEY),
    links: [{ label: 'github.com/janedoe', href: 'https://github.com/janedoe' }],
  };
}

describe('Header', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
    vi.unstubAllEnvs();
  });

  it('renders the name as the primary heading and contact links that never need a key', async () => {
    const data = await buildData();
    render(<Header data={data} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'github.com/janedoe' })).toHaveAttribute(
      'href',
      'https://github.com/janedoe',
    );
    expect(screen.getByRole('link', { name: 'github.com/janedoe' })).toHaveAttribute(
      'rel',
      'noreferrer',
    );
  });

  it('keeps location/email/phone hidden when no ?k= key is present', async () => {
    const data = await buildData();
    const { container } = render(<Header data={data} />);

    expect(screen.queryByText('Remote')).not.toBeInTheDocument();
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('555-0100')).not.toBeInTheDocument();
    // Defense in depth: the raw ciphertext itself must never land in the DOM
    // either, not just the plaintext — Header should render neither.
    expect(container.textContent).not.toContain(data.location);
    expect(container.textContent).not.toContain(data.email);
    expect(container.textContent).not.toContain(data.phone);
  });

  it('renders one contact link per links entry, each with rel="noreferrer"', async () => {
    const data = await buildData();
    data.links = [
      { label: 'github.com/janedoe', href: 'https://github.com/janedoe' },
      { label: 'linkedin.com/in/janedoe', href: 'https://linkedin.com/in/janedoe' },
    ];
    render(<Header data={data} />);

    for (const link of data.links) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('decrypts and renders location/email/phone when a valid ?k= key is present', async () => {
    window.history.pushState({}, '', `/?k=${KEY}`);
    const data = await buildData();
    render(<Header data={data} />);

    expect(await screen.findByText('Remote')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'jane@example.com' })).toHaveAttribute(
      'href',
      'mailto:jane@example.com',
    );
    expect(screen.getByText('555-0100')).toBeInTheDocument();
  });

  it('keeps location/email/phone hidden when the ?k= key is wrong', async () => {
    window.history.pushState({}, '', '/?k=wrong-key');
    const data = await buildData();
    const { container } = render(<Header data={data} />);

    // Decryption failure is async (a rejected Web Crypto promise); flush the
    // microtask queue under `act` so the resulting no-op state update settles
    // before asserting nothing ever rendered.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(screen.queryByText('Remote')).not.toBeInTheDocument();
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('555-0100')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain(data.location);
    expect(container.textContent).not.toContain(data.email);
    expect(container.textContent).not.toContain(data.phone);
  });

  it('appends the ?k= key to the own-domain link once a valid key unlocks the page, leaving other links untouched', async () => {
    vi.stubEnv('GATSBY_SITE_URL', 'https://resume.marwynn.net');
    window.history.pushState({}, '', `/?k=${KEY}`);
    const data = await buildData();
    data.links = [
      { label: 'github.com/janedoe', href: 'https://github.com/janedoe' },
      { label: 'resume.marwynn.net', href: 'https://resume.marwynn.net' },
    ];
    render(<Header data={data} />);

    await screen.findByText('Remote'); // wait for decrypt to settle before checking links

    expect(screen.getByRole('link', { name: 'github.com/janedoe' })).toHaveAttribute(
      'href',
      'https://github.com/janedoe',
    );
    expect(screen.getByRole('link', { name: 'resume.marwynn.net' })).toHaveAttribute(
      'href',
      `https://resume.marwynn.net/?k=${KEY}`,
    );
  });

  it('leaves the own-domain link bare when no valid key is present', async () => {
    vi.stubEnv('GATSBY_SITE_URL', 'https://resume.marwynn.net');
    const data = await buildData();
    data.links = [{ label: 'resume.marwynn.net', href: 'https://resume.marwynn.net' }];
    render(<Header data={data} />);

    expect(screen.getByRole('link', { name: 'resume.marwynn.net' })).toHaveAttribute(
      'href',
      'https://resume.marwynn.net/',
    );
  });

  it('resolves the own-domain link to GATSBY_SITE_URL for the current environment, e.g. staging', async () => {
    vi.stubEnv('GATSBY_SITE_URL', 'https://staging.resume.marwynn.net');
    window.history.pushState({}, '', `/?k=${KEY}`);
    const data = await buildData();
    data.links = [{ label: 'resume.marwynn.net', href: 'https://resume.marwynn.net' }];
    render(<Header data={data} />);

    await screen.findByText('Remote');

    expect(screen.getByRole('link', { name: 'staging.resume.marwynn.net' })).toHaveAttribute(
      'href',
      `https://staging.resume.marwynn.net/?k=${KEY}`,
    );
  });

  it('falls back to localhost:8000 for the own-domain link when GATSBY_SITE_URL is unset, as in local development', async () => {
    const data = await buildData();
    data.links = [{ label: 'resume.marwynn.net', href: 'https://resume.marwynn.net' }];
    render(<Header data={data} />);

    expect(screen.getByRole('link', { name: 'localhost:8000' })).toHaveAttribute(
      'href',
      'http://localhost:8000/',
    );
  });
});
