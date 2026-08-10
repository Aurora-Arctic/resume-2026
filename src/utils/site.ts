// Reads the current site URL from GATSBY_SITE_URL (set per environment via
// .env.development/.env.production or netlify.toml per-context overrides) or
// falls back to localhost:8000 for local development. Read fresh per call,
// not cached at module scope, so it reflects the current environment even if
// the env var changes mid-session (useful for SSR/build-time hydration).
export const getSiteUrl = (): string => process.env.GATSBY_SITE_URL ?? 'http://localhost:8000';
