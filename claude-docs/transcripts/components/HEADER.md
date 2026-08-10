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

## Contact list split into three, right-aligned at the new desktop breakpoint (2026-08-09)

Landed alongside `Resume`'s new two-column grid (see [RESUME.md](RESUME.md) for the layout/breakpoint side of this work) — `Header` itself needed several internal changes to work as a narrow right-hand column: right-aligned text, a smaller `h1` so the name doesn't wrap, and its contact info broken onto distinct lines instead of one flat wrapping list.

**Markup**: the single flat `<ul className="resume-header__contact">` (location + email + phone + links all as sibling `<li>`s) became three separate blocks in the same order, each landing on its own line via ordinary block flow: `location` as a standalone `<p className="resume-header__location">`; email+phone in `<ul className="resume-header__contact" aria-label="Contact details">`, gated on `(contact.email || contact.phone)` so an empty `<ul>` never lands in the accessibility tree when neither has decrypted (mirrors how `location` was already conditionally omitted); `links` in its own always-rendered `<ul className="resume-header__links" aria-label="Links">`. The `aria-label`s are new — needed once there are two adjacent `<ul>`s with no visible heading between them, so screen readers don't announce two unlabeled lists back to back.

**Styling**: `.resume-header` stays left-aligned on mobile (unchanged) and switches to `text-align: right` only inside the `min-width: $breakpoint-desktop` block — right-aligned text only makes sense once the header is actually a right-hand column, not while it's a full-width mobile block. The two lists' shared wrapping-row styles got factored into a `%resume-header-list` Sass placeholder (`@extend`ed by both `&__contact` and `&__links`) since they're now visually identical; both add `justify-content: flex-end` at the same desktop breakpoint so wrapped items hug the right edge alongside the text. The email/phone-own-line and links-own-line split itself (the markup change above) holds at every width, just left-aligned on mobile.

**`h1` sizing**: `.resume-header h1` gets a `min-width: $breakpoint-desktop` override with a fixed `font-size: 1.75rem` — deliberately not a second `clamp()`. The global `h1` rule in `src/scss/_typography.scss` uses `clamp(2rem, 4vw, 3rem)`, but `.paper-card` caps at 960px wide, so the header column's actual available width stops growing past `$breakpoint-desktop` too; a `vw`-based clamp would keep tracking raw viewport width past that point even though the column itself isn't getting any wider. The fixed value is scoped by selector specificity (`.resume-header h1` beats the bare `h1` rule regardless of stylesheet load order), so the global rule and every other `h1` on the page are untouched. This is a best-effort size against `src/data/resume.ts`'s still-placeholder name/title content, not a guarantee against arbitrary future name lengths.

**Tests**: `e2e/contact-encryption.spec.ts` asserted directly on `.resume-header__contact li` counts (3 locked/wrong-key, 6 unlocked), which broke the moment the list split — updated to check `.resume-header__contact li` (0 locked, 2 unlocked) and the new `.resume-header__links li` (3 in both states) separately, plus `.resume-header__location` visibility. `index.test.tsx` gained two `getByRole('list', { name: ... })` assertions (`'Links'` always present, `'Contact details'` present only once decrypted) as more direct coverage of the split shape than the e2e count-based checks alone.

## Title split onto its own line, contact list re-merged and reordered (2026-08-09)

Follow-up round of ad hoc adjustments requested directly against the layout above, landed in two passes — one by Claude, one by the user editing the same files by hand afterward.

**Claude's pass**: `data.title` now splits on `" | "` and renders each segment on its own line inside `.resume-header__title` (a `<br />` between `React.Fragment`-wrapped segments) — a no-op for any title without that separator, so it doesn't assume every title is two-part. `resumeData.header.title` also dropped its `"for Developer Experience"` suffix. The `&__contact` list was reordered to email-then-phone (from phone-then-email — the user corrected this mid-task) each still on its own line via `flex-direction: column` rather than the wrapping-row layout `&__links` uses, so the two lists stopped being visually identical and the shared `%resume-header-list` Sass placeholder was inlined back into `&__links` alone rather than kept as a now-single-user abstraction. `Resume/index.scss`'s `column-gap` doubled from `2rem` to `4rem` ("100% more space" between the header/summary columns), and `.resume-summary` briefly gained a `margin-top: 3rem` (desktop-only) to line its top edge up better against the taller header block.

**User's manual pass** (on top of the above, same session): moved `location` out of its standalone `<p className="resume-header__location">` and into the `&__contact` `<ul>` as a third `<li>` (after email and phone) — the separate paragraph and its SCSS rule are gone; all three contact fields now live in one list, still gated as a whole on `(contact.email || contact.phone)` since they always decrypt together. Added `li { margin: 0.125rem 0; }` inside `&__contact`, plus an extra `margin-top: 0.25rem` on the phone `<li>` specifically via a `resume-header__contact__phone` class, and rebalanced the surrounding vertical rhythm (`h1` `margin-bottom: 1.25rem`, `&__title`/`&__contact`/`&__links` all `margin: 0.75rem 0`-ish, up from the tighter `0`/`0.25rem`/`0.5rem` values). Reverted `.resume-summary`'s desktop `margin-top` back to `0` and changed `.resume`'s desktop `grid-template-columns` from `2fr 1fr` to `5fr 3fr` (see [RESUME.md](RESUME.md)) — both undoing/adjusting choices from Claude's pass above. Also bumped the _global_ `p` line-height in `src/scss/_typography.scss` from `1.375` to `1.5`, outside `Header` entirely.

**Tests**: `e2e/contact-encryption.spec.ts`'s `.resume-header__location` assertions were removed (the selector no longer exists) and the unlocked-state `.resume-header__contact li` count moved from 2 to 3 (email + phone + location, now one list). `index.test.tsx` needed no changes — its location assertion (`findByText('Remote')`) checks text content, not the containing element, so it kept passing across the markup move.

## Phone number became a `tel:` link (2026-08-10)

Landed as part of the print link-URL-reveal feature — full rationale lives in [LAYOUT-SETUP.md](../LAYOUT-SETUP.md)'s "A fifth shared partial: `_print.scss`" section; this is just the `Header`-side pointer. The phone `<li>` (previously plain text) now wraps `{contact.phone}` in `<a href={\`tel:${contact.phone.replace(/\D/g, '')}\`}>`— digits-only href (confirmed with the user), visible text unchanged, mirroring the existing`mailto:`link right above it. No`index.scss`change needed — the`&--phone`rule targets the`<li>`, and anchor styling already comes for free from the global `a`rule.`index.test.tsx` gained an assertion on the existing decrypt test plus a new test with a punctuation-heavy fixture (`'+1 (555) 010-0199'`→`tel:15550100199`) proving full digit-stripping. `e2e/contact-encryption.spec.ts`'s `REAL_KEY`-gated test gained a `.resume-header__contact a[href^="tel:"]`visibility assertion alongside its existing`mailto:` one.
