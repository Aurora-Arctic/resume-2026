# Header — Implementation Record

This document is a transcript of the work done around `src/components/Header` — the resume's name/title/contact block. See [RESUME.md](RESUME.md) for the shared section-order, data-model, and layout-flexibility decisions behind this whole batch of scaffolding work; this document covers only what's specific to `Header`.

## Why it exists

`src/pages/index.tsx` previously rendered a static `<h1>Resume 2026</h1>` — a site title, not resume content. A real resume's `<h1>` should be the candidate's name, per standard resume/ATS convention (name + title + contact block at the very top, parseable without headers/footers). `Header` is that block, scaffolded now with placeholder data (`resumeData.header` in `src/data/resume.ts`) ahead of real content being filled in.

## Current state

- `index.tsx`: takes `data: HeaderData` (`name`, `title`, `location`, `email`, `phone`, `links: ContactLink[]`). Renders `name` as `<h1>`, `title` as a paragraph, and the rest as a flat `<ul>` — location, a `mailto:` link for email, phone, then one `<li>` per `links` entry.
- `index.scss`: minimal — wrapping flex row for the contact list, spacing under the title. No columns.
- `index.test.tsx`: renders with sample data, asserts the `<h1>` reads the name, and that the email/GitHub links have the right `href`s.
- Deliberately no styling decisions about visual hierarchy/prominence yet — that's content-and-design work for the follow-up task that fills in real data.
