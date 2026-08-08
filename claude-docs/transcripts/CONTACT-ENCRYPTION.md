# Contact Encryption — Implementation Record

This document is a transcript of the work done to keep `resumeData.header`'s
email/phone out of the static build as plaintext.

## Why it exists

The site is fully static — no backend, no server that could hold a secret.
The user wanted their email/phone (`src/data/resume.ts`) to not sit as
plaintext in the built HTML/JS, where scrapers regex-scan for `mailto:`
links and phone-shaped strings. The design: encrypt those two fields at
rest, and only decrypt them client-side when the page is loaded with a
secret key supplied as a URL query param (`?k=<key>`) — a link the site
owner controls who they hand out.

This was clarified up front with the user, since "secure encryption key"
doesn't fully make sense for a static site: any key baked into the JS
bundle is visible to anyone via view-source or devtools. The user confirmed
the key would _not_ live in the bundle — only ever in the URL, supplied at
request time. That's the load-bearing design constraint everything below
follows from. It's still explicitly framed as scraper _deterrence_, not
real confidentiality: the ciphertext and the decrypt algorithm both ship
in the public bundle, so a valid `?k=` link (or a successful brute-force)
still reveals the plaintext to whoever has it.

The user also initially asked for "a decryption key ... for use later",
separate from the encryption key — worth calling out explicitly since
AES-GCM is symmetric. There's only one key: the same value that encrypts
the plaintext offline is the exact value passed as `?k=` to decrypt it in
the browser. `generate-key.ts` only ever needs to produce one.

## Algorithm

AES-256-GCM. The key argument is an arbitrary string, SHA-256'd into a
fixed 256-bit key (`deriveKey` in `src/utils/crypto.ts`) so the URL value
doesn't need to be exactly 32 raw bytes. A random 12-byte IV is generated
per encryption call and prepended to the ciphertext; the whole thing
(`iv || ciphertext || authTag`) is base64url-encoded so it's safe to drop
into a TS source file or a URL without further escaping. GCM's
authentication tag means a wrong key makes `crypto.subtle.decrypt` reject
outright rather than returning garbage — the Header component treats that
identically to "no key at all": nothing renders, no error surfaces.

`crypto.subtle` (Web Crypto) was chosen over adding a dependency
(`crypto-js` etc.) because it's already a global in every relevant runtime
here — browsers, and Node 19+ (confirmed via `Docker/Dockerfile.node`
pinning `node:26.6.0`). One implementation in `src/utils/crypto.ts` serves
both the browser (Header) and the Node CLI scripts, so the encrypt and
decrypt sides can never drift out of sync with each other.

## The `ts-node` dead end

The original plan was to run the CLI scripts (`scripts/generate-key.ts`,
`scripts/encrypt-value.ts`) via `ts-node`, which was already listed in
`package.json`'s `dependencies` (oddly, not `devDependencies` — and,
turns out, unused anywhere else in the repo). In practice, `npx ts-node
scripts/generate-key.ts` crashed immediately on startup:

```
TypeError: Cannot read properties of undefined (reading 'fileExists')
    at readConfig (ts-node/dist/configuration.js:91:33)
```

`ts-node@10.9.2` is incompatible with this repo's `typescript@^7.0.2` — a
major version far newer than ts-node 10 was ever built against; its
internal use of the TS compiler API breaks. Rather than force a
compatible-but-outdated `ts-node`/`typescript` pairing (which would ripple
into the main `tsc --noEmit` typecheck the whole build depends on), the
scripts run under plain `node` instead: Node 26 has native TypeScript
type-stripping support built in, no extra tooling required. The now-dead
`ts-node` dependency was removed from `package.json` entirely.

Two smaller wrinkles from that switch:

- Node's native TS support follows normal ESM resolution rules, which
  require explicit file extensions — `from '../src/utils/crypto.ts'`, not
  `'../src/utils/crypto'`.
- Without a `"type": "module"` in the nearest `package.json`, Node has to
  sniff each file's syntax to decide it's actually ESM, which prints a
  `MODULE_TYPELESS_PACKAGE_JSON` warning. Rather than set `"type":
"module"` on the repo root `package.json` (which risks changing how
  Node resolves the rest of the CommonJS-assuming tooling, like
  `Docker/link-cache.js`'s `require()` calls), a scoped `scripts/package.json`
  with just `{"type": "module"}` covers the two new scripts alone, and
  the npm scripts additionally pass `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`
  as a second layer (the nested `package.json` doesn't cover
  `src/utils/crypto.ts` itself, which lives outside `scripts/`).

## `src/utils/crypto.ts` doesn't need Node's `Buffer`

Base64url encode/decode uses `btoa`/`atob` + `String.fromCharCode`/
`charCodeAt` rather than `Buffer`, deliberately — `Buffer` is Node-only and
this module needs to run unmodified in the browser bundle. `btoa`/`atob`
are global in both Node (since Node 16) and browsers, so no polyfill or
bundler shim is needed either way.

## jsdom doesn't implement `crypto.subtle`

`src/utils/crypto.test.ts` and `src/components/Header/index.test.tsx`
initially failed under Vitest with `crypto.subtle` being `undefined`. jsdom
implements `crypto.getRandomValues` but explicitly leaves `crypto.subtle`
out of scope (by design, not a bug to fix upstream). This is the same
shape of problem `vitest.setup.ts` already solved for `localStorage`
(Node's own native `localStorage` getter shadows jsdom's working one) —
so the fix follows the same pattern: `vitest.setup.ts` now also swaps
`window.crypto` for Node's own `webcrypto` (`node:crypto`) whenever
`window.crypto.subtle` is missing, which has both `getRandomValues` and
`subtle` and matches the real-browser shape.

## Header component changes

`src/components/Header/index.tsx` was a pure, synchronous, SSR-safe
component before this — no hooks, no client-only branches. It's now
client-hydrated for exactly two fields:

- `useEffect` on mount reads `k` from `new URLSearchParams(window.location.search)`.
  No key → returns early, leaving `contact` at its initial `{ email: null,
phone: null }`.
- With a key, `Promise.all([decryptText(data.email, key), decryptText(data.phone,
key)])` either sets both decrypted values or (on any rejection —
  wrong key) falls back to the same `{ null, null }` state. Both paths
  render identically: the `<li>` for a `null` field is simply omitted, never
  ciphertext, never a rendered error state.
- The `links` anchors (LinkedIn/GitHub/etc., already rendered pre-existing)
  gained `rel="noreferrer"`. This isn't a general link-hygiene pass — it's
  load-bearing here: without it, a visitor on an unlocked `?k=...` page
  clicking through to e.g. GitHub would leak the key to GitHub via the
  `Referer` header, defeating the whole point of not shipping the key in
  the bundle.

## Testing

- `src/utils/crypto.test.ts` covers the crypto module in isolation and
  deterministically: round-trip decrypt, distinct ciphertext per call
  (random IV), rejection on wrong key, and `generateKey` uniqueness. Kept
  separate from the Header tests specifically so the tricky "does decrypt
  fail correctly" assertions don't depend on React effect timing.
- `src/components/Header/index.test.tsx` covers the four render states:
  base fields that never need a key, hidden-with-no-key, decrypted-with-
  valid-key (`await screen.findByRole(...)`, since the effect settles
  asynchronously), and hidden-with-wrong-key. The wrong-key case needs an
  explicit flush (`await act(async () => { await new Promise(resolve =>
setTimeout(resolve, 50)); })`) since there's no positive assertion to
  await — a rejected decrypt is a non-event, so the test has to give the
  microtask/short-timer queue room to actually settle before asserting
  nothing appeared.
- `e2e/contact-encryption.spec.ts` exercises the real thing end-to-end in
  headless Chromium against the actual built-and-served site: no key,
  wrong key, and the real key (the one `resumeData.header`'s placeholder
  email/phone were encrypted with) all produce the expected DOM. This is
  the only layer that proves the whole chain — real build output, real
  browser Web Crypto, real query-param parsing — actually works together;
  the component/unit tests above cover the logic in isolation but can't
  catch an SSR/hydration-only failure mode the way a real browser run can.
- Verified directly (not just via automated tests) that `public/index.html`
  contains neither the plaintext placeholder values nor the key after
  `npm run build` — only the ciphertext, and only inside the page's JS
  bundle (`resumeData` itself has to ship somewhere for the client to
  decrypt against).

## Key handling

The real key used for `resumeData.header`'s placeholder ciphertext was
generated via `npm run generate:key` and handed to the user directly in
conversation — never written to a file, never committed. It also appears
in `e2e/contact-encryption.spec.ts` as a test fixture, which is fine
specifically because it only ever protects placeholder data
(`placeholder@example.com` / `000-000-0000`), not anything real. When real
contact info replaces the placeholders (a separate, later content task —
see `CLAUDE.md`'s note on `resumeData` being placeholder-only for now), a
fresh key must be generated for that real data and the e2e fixture
updated to a value that is _not_ meant to protect anything sensitive.

## `location` added; the placeholder-key/real-data close call

Follow-up task: the user asked to also encrypt `HeaderData.location`,
matching the `email`/`phone` scheme exactly (same `deriveKey`/AES-GCM
helper, same client-side decrypt-on-mount, same hide-on-null render). The
`HeaderData` interface, `Header`'s `useEffect`/`Promise.all`, and its
`DecryptedContact` state all extended from two fields to three
uniformly — no new branches, since the existing "all-or-nothing" decrypt
already generalized cleanly.

While reviewing the resulting diff, the _exact_ key-handling risk flagged
in "Key handling" above actually happened: the user encrypted their real
location/email/phone using the same key this transcript's "Key handling"
section describes as `generate-key`'s original placeholder-protecting
output — the same value already printed in plaintext earlier in the
conversation and already committed (in the working tree, not yet pushed)
inside `e2e/contact-encryption.spec.ts`. Decrypting the new ciphertext
with that key confirmed it: real email, real phone, real city, no longer
placeholders. Since this repo is public on GitHub
(`Aurora-Arctic/resume-2026`), had this been committed and pushed as-is,
the key needed to unlock the "hidden" contact info would have shipped
right alongside it in the same commit — full exposure, not just weakened
scraper-deterrence.

Caught before any commit happened, so no real leak occurred. The user
independently generated a fresh key and re-encrypted with it (not done by
Claude — the user handled their own real PII directly). The structural
fix, to stop this from being possible again even by accident, was to
change what the e2e test is allowed to assert:

- Previously, `e2e/contact-encryption.spec.ts` hardcoded the actual key
  and asserted exact decrypted plaintext (`placeholder@example.com`,
  `000-000-0000`) against the real built site — which only worked because
  the data was still placeholder at the time, and became exactly the
  footgun above the moment it wasn't.
- Now, the "hidden" cases (no key / wrong key) assert structurally —
  `.resume-header__contact li` has exactly one entry (the static `links`
  item) — without needing to know any plaintext or any key at all. This
  is actually a better test than the string-matching version: it stays
  correct regardless of what `resumeData.header` ever contains.
- The successful-decrypt path — the one case that genuinely needs a
  working key — now reads `process.env.RESUME_CONTACT_KEY` and
  self-skips (`test.skip(!REAL_KEY, ...)`) when unset, which is always the
  case in CI/on a fresh checkout. A maintainer who wants that coverage
  locally sets the env var themselves (out of band, never committed) and
  the test asserts shape (`li` count, an `a[href^="mailto:"]` exists)
  rather than specific values, so no real PII ever needs to be typed into
  a repo file even for someone who does set the var.

Net effect: it's no longer possible for the e2e suite itself to demand a
real secret be committed in order to pass. `src/components/Header/index.test.tsx`
and `src/utils/crypto.test.ts` still fully exercise the successful-decrypt
logic — they always used their own throwaway `'test-key'`/`generateKey()`
fixtures, never anything tied to real data, so no change was needed
there beyond adding `location` alongside `email`/`phone`.

## Deliberately propagating the key to `resume.marwynn.net`

When `resumeData` was filled in with real content (see
[claude-docs/transcripts/components/HEADER.md](components/HEADER.md) for
the full data-sourcing story), one of the new `header.links` entries was
the user's portfolio site, `resume.marwynn.net` — which turns out to run
the same client-side contact-encryption scheme as this site. The user
asked for the page's own `?k=` value to be carried over to that link
automatically, so unlocking this page also unlocks the portfolio without
the visitor needing the link twice.

This is worth distinguishing carefully from the `Referer`-leak concern
`rel="noreferrer"` exists for elsewhere in this doc: that guard stops the
_browser_ from automatically attaching the key to an outbound request
header without anyone asking it to. This is the opposite — code in
`Header` deliberately reads its own `decryptKey` state and writes `k` into
that one link's query string on purpose, because the destination is a
site the same person owns and controls, and both sites benefit from a
visitor not having to unlock twice. `rel="noreferrer"` still applies to
this link too (it still blocks the automatic `Referer` header regardless
of what's in the URL) — the two mechanisms aren't in tension, they just
solve different problems.

Implementation stayed narrowly scoped to avoid this becoming a general
"leak the key everywhere" footgun: the propagation only fires for a link
whose `hostname` is exactly `resume.marwynn.net` (checked via `new
URL(href).hostname`, not a substring/prefix match), so adding an unrelated
link to `header.links` later can't accidentally start leaking the key to
it too.

## `resume.marwynn.net` is this site, not a separate portfolio — resolving it per environment

The framing above — "the portfolio site, which happens to run the same
encryption scheme" — turned out to be a misreading. `netlify.toml` (already
in the repo, not new) redirects the old `marwynn.net`/`www.marwynn.net`
domains to `resume.marwynn.net`: that's this site's own production domain,
not a separate site the same person happens to also own. The `header.links`
entry was, from the start, a self-link.

That distinction matters once the same build can run in three different
places — a local dev server, a staging deploy, and production — each with
its own domain. A self-link hardcoded to `https://resume.marwynn.net` is
simply wrong on the other two: on staging it'd send a visitor away from the
build they're looking at and back to production instead, and in local dev
it's not reachable at all in a way that demonstrates the feature.

Fix: give the app one source of truth for "what domain is this build
actually running on" and have the self-link resolve against it instead of
a fixed string.

- `gatsby-config.ts`'s `siteMetadata.siteUrl` now reads
  `process.env.GATSBY_SITE_URL`, falling back to `http://localhost:8000` if
  unset (keeps `tsc`/Vitest, which never go through Gatsby's own env
  loading, from seeing `undefined`).
- Two new root-level files, `.env.development` and `.env.production`, set
  `GATSBY_SITE_URL` to `http://localhost:8000` and
  `https://resume.marwynn.net` respectively — Gatsby's CLI loads
  `.env.${NODE_ENV}` automatically (`gatsby develop` sets `NODE_ENV=development`,
  `gatsby build` sets `NODE_ENV=production`, both unprompted), and `dotenv`
  never overwrites a `process.env` value that's already set going in.
- `netlify.toml` gained `[context.production.environment]` and
  `[context.staging.environment]` blocks. Netlify injects context-specific
  env vars into the build's process _before_ `npm run build` runs, so they
  win over `.env.production`'s file-based default per the same
  never-overwrite rule above — `[context.staging.environment]` overrides
  `GATSBY_SITE_URL` to `https://staging.resume.marwynn.net` specifically for
  deploys of the `staging` branch (Netlify supports a branch name directly
  as a context key, not just the built-in `production`/`deploy-preview`/
  `branch-deploy`), while `[context.production.environment]` just restates
  `.env.production`'s value explicitly for symmetry.
- `Header/index.tsx`: the old `KEY_PROPAGATION_HOSTNAME`/`withDecryptKey`
  pair (matched a link's hostname, and only ever mutated `href`) became
  `OWN_DOMAIN_HOSTNAME`/`resolveLink`. Same hostname match against the
  literal `resume.marwynn.net` stored in `resumeData` — that string is now
  purely a _marker_ for "this is the self-link", not the value that actually
  renders — but the matched link's `label` and `href` are both rewritten
  from `getSiteUrl()` (`process.env.GATSBY_SITE_URL`, same fallback as
  `gatsby-config.ts`), with `?k=` appended when a decrypt key is present.
  `getSiteUrl()` reads the env var fresh on every call rather than caching
  it at module scope specifically so `Header/index.test.tsx` can exercise
  more than one environment value per test run via `vi.stubEnv` — a
  module-scope constant would have been fixed at import time and unable to
  vary between test cases.
- Every other `links` entry (LinkedIn, GitHub, ...) is untouched by
  `resolveLink` — the hostname check still gates the whole rewrite, so
  unrelated links can't accidentally start resolving against `GATSBY_SITE_URL`
  too.
- `Header/index.test.tsx`: the two existing key-propagation cases now
  `vi.stubEnv('GATSBY_SITE_URL', 'https://resume.marwynn.net')` before
  rendering, so their assertions stay meaningful instead of silently
  falling back to the `localhost:8000` default. Two new cases cover the
  behavior this change actually exists for: resolving to
  `staging.resume.marwynn.net` when that env var is set, and falling back
  to `localhost:8000` when it's unset entirely (the local-dev case, and
  also what `tsc`/plain Vitest runs see with no Gatsby env loading at all).
  `afterEach` now also calls `vi.unstubAllEnvs()` alongside the pre-existing
  `window.history.pushState` reset, so a stubbed env var from one test can't
  leak into the next.
