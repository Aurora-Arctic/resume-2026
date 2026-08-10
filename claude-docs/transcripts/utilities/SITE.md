# site — Implementation History

## Origin

The `getSiteUrl()` function was triplicated verbatim across three components:

```tsx
const getSiteUrl = (): string => process.env.GATSBY_SITE_URL ?? 'http://localhost:8000';
```

It appeared identically in:

1. `Header/index.tsx:64` — used by `resolveLink()` to resolve the "this same site" link to the current deployment's URL
2. `Summary/index.tsx:11` — used to render the print-note explaining ellipsis truncation
3. `Layout/index.tsx:15` — used to render the "always updated version" link in the page footer

Each copy carried (or lacked) the same rationale: the function must read `GATSBY_SITE_URL` fresh on every call, **not cached at module scope**, so it reflects the environment the build is running in:

- `localhost:8000` in development (`.env.development`)
- `staging.resume.marwynn.net` on staging (netlify.toml context override)
- `resume.marwynn.net` on production (netlify.toml context override)

This fresh-read contract was implicit in the copies and easy to lose if they ever diverged.

## Consolidation

As part of the "Consolidate shared TS code" task, the function was extracted into a dedicated utility module `src/utils/site.ts`:

```tsx
export const getSiteUrl = (): string => process.env.GATSBY_SITE_URL ?? 'http://localhost:8000';
```

The rationale comment was moved into the module, making the fresh-read contract explicit:

```tsx
// Read fresh per call, not cached at module scope, so it reflects
// GATSBY_SITE_URL set by .env.development/.env.production or netlify.toml's
// per-context overrides: localhost:8000 in development, staging.resume.marwynn.net
// on staging, resume.marwynn.net on main.
```

All three call sites were updated to import the function:

- Header: `import { getSiteUrl } from '../../utils/site';`
- Summary: `import { getSiteUrl } from '../../utils/site';`
- Layout: `import { getSiteUrl } from '../../utils/site';`

The output behavior remains identical — this is purely a consolidation refactor, with no functional changes.

## Testing

A unit test suite (`src/utils/site.test.ts`) was added covering:

1. `GATSBY_SITE_URL` is returned when set
2. Fallback to localhost when `GATSBY_SITE_URL` is unset
3. Fresh reads from `process.env` per call (not cached)

Integration testing is provided by existing test suites for Header, Summary, and Layout components.
