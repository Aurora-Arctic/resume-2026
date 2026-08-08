# Header — Implementation Record

This document is a transcript of the work done around `src/components/Header` — the resume's name/title/contact block. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Header`.

## Why it exists

`src/pages/index.tsx` previously rendered a static `<h1>Resume 2026</h1>` — a site title, not resume content. A real resume's `<h1>` should be the candidate's name, per standard resume/ATS convention (name + title + contact block at the very top, parseable without headers/footers). `Header` is that block, scaffolded now with placeholder data (`resumeData.header` in `src/data/resume.ts`) ahead of real content being filled in.

## Current state

- `index.tsx`: takes `data: HeaderData` (`name`, `title`, `location`, `email`, `phone`, `links: ContactLink[]`). Renders `name` as `<h1>`, `title` as a paragraph, and the rest as a flat `<ul>` — location, a `mailto:` link for email, phone, then one `<li>` per `links` entry.
- `index.scss`: minimal — wrapping flex row for the contact list, spacing under the title. No columns.
- `index.test.tsx`: renders with sample data, asserts the `<h1>` reads the name, and that the email/GitHub links have the right `href`s.
- Deliberately no styling decisions about visual hierarchy/prominence yet — that's content-and-design work for the follow-up task that fills in real data.

## Contact info encrypted at rest

`email`/`phone`, and later `location` too, moved from plaintext to
AES-GCM ciphertext, decrypted client-side only when the page is loaded
with a `?k=` URL key. Full rationale and implementation detail (including
a close call where real contact info nearly got encrypted with a key
already exposed in a committed test fixture — caught before anything was
pushed) lives in
[claude-docs/transcripts/CONTACT-ENCRYPTION.md](../CONTACT-ENCRYPTION.md) —
this is just the pointer from `Header`'s own history. In short: `index.tsx`
gained a `useEffect`/`useState` pair to decrypt on mount (previously a pure
synchronous component with no hooks at all), all three fields decrypt
together as one all-or-nothing `Promise.all`, and the pre-existing `links`
anchors gained `rel="noreferrer"` so clicking one from an unlocked page
can't leak the key via the `Referer` header.

## Real content, and the `resume.marwynn.net` key-propagation link

`resumeData` (previously all placeholder — see `CLAUDE.md`'s note on this)
was filled in with real career data, sourced from a LinkedIn "Save to PDF"
export plus an older resume site (`https://marwynn-resume.netlify.app/`)
for the richer skills/projects detail LinkedIn's export lacked.
`header.location`/`.email`/`.phone` (the encrypted fields) were
deliberately left untouched — only `name`, `title`, and `links` changed.

One of the new `links` entries, the portfolio site at
`resume.marwynn.net`, shares this page's contact-encryption scheme. The
user asked for the page's own unlocking `?k=` key to be carried over to
that link automatically, so a visitor who already unlocked this page
doesn't have to re-supply the key there. This needed an actual behavior
change, not just a data edit:

- `Header` gained a `decryptKey` state (`useState<string | null>(null)`),
  set alongside the existing `contact` state once `Promise.all(...)`
  resolves successfully (left `null` on no-key or decrypt failure — the
  same all-or-nothing shape the contact fields already use).
- A new `withDecryptKey(href, key)` helper builds each link's rendered
  `href` through `URL`/`URLSearchParams` (not string concatenation, to
  avoid double-`?` bugs), only appending `k` when the link's `hostname`
  matches `resume.marwynn.net` — every other link (LinkedIn, GitHub)
  renders its raw `href` unchanged.
- `rel="noreferrer"` stays on all links, including this one — it's a
  distinct mechanism from the deliberate key propagation (blocks the
  browser's automatic `Referer` header; the key here is instead
  explicitly embedded in the URL by this code, on purpose). See
  [claude-docs/transcripts/CONTACT-ENCRYPTION.md](../CONTACT-ENCRYPTION.md)
  for why this is framed as an intentional exception rather than a
  contradiction of the no-leak rationale above.
- `index.test.tsx` gained two cases: the key gets appended to the
  `resume.marwynn.net` link (and only that link) once a valid `?k=`
  unlocks the page, and that link stays bare with no key present.

## The `resume.marwynn.net` link resolves per environment, not a fixed string

Follow-up: `resume.marwynn.net` turned out not to be a separate portfolio
site sharing this one's encryption scheme, as the previous section assumed
— `netlify.toml` already redirects the old `marwynn.net`/`www.marwynn.net`
domains to `resume.marwynn.net`, meaning that's this site's own production
domain. The `header.links` entry was a self-link all along, which matters
once this same build can run in development, on a staging deploy, and in
production — three different actual domains, so hardcoding one of them into
the self-link is only ever correct in one of the three places.

`Header/index.tsx`'s `KEY_PROPAGATION_HOSTNAME`/`withDecryptKey` pair
became `OWN_DOMAIN_HOSTNAME`/`resolveLink`: still matched by hostname
against the literal `resume.marwynn.net` (now just a marker for "this is
the self-link" inside `resumeData`, not the rendered value), but the
matched link's `label` and `href` are both rewritten from a new
`getSiteUrl()` helper (`process.env.GATSBY_SITE_URL`, falling back to
`http://localhost:8000`) instead of only ever appending `?k=` to whatever
`href` was already in the data. `getSiteUrl()` is called fresh each time
rather than cached at module scope, so `vi.stubEnv` in tests can vary it
per test case. Full rationale for the surrounding env-var/`.env.*`/
`netlify.toml` plumbing lives in
[claude-docs/transcripts/CONTACT-ENCRYPTION.md](../CONTACT-ENCRYPTION.md)'s
"`resume.marwynn.net` is this site, not a separate portfolio" section —
this is just the `Header`-side pointer. `index.test.tsx`'s two existing
cases now stub `GATSBY_SITE_URL` to keep their assertions meaningful, plus
two new cases: resolving to a staging domain when that env var is set, and
falling back to `localhost:8000` when it's unset (local dev, and any
non-Gatsby test/typecheck run).
