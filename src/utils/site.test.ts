import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSiteUrl } from './site';

describe('getSiteUrl', () => {
  const originalEnv = process.env.GATSBY_SITE_URL;

  beforeEach(() => {
    delete process.env.GATSBY_SITE_URL;
  });

  afterEach(() => {
    process.env.GATSBY_SITE_URL = originalEnv;
  });

  it('returns GATSBY_SITE_URL when set', () => {
    process.env.GATSBY_SITE_URL = 'https://resume.marwynn.net';
    expect(getSiteUrl()).toBe('https://resume.marwynn.net');
  });

  it('returns localhost fallback when GATSBY_SITE_URL is unset', () => {
    expect(getSiteUrl()).toBe('http://localhost:8000');
  });

  it('reads fresh from env each call (not cached)', () => {
    expect(getSiteUrl()).toBe('http://localhost:8000');
    process.env.GATSBY_SITE_URL = 'https://staging.resume.marwynn.net';
    expect(getSiteUrl()).toBe('https://staging.resume.marwynn.net');
  });
});
