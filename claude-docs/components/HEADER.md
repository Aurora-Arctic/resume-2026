# Header — Summary

Full implementation history: [claude-docs/transcripts/components/HEADER.md](../transcripts/components/HEADER.md)

- Renders the resume's name/title/contact block from a `HeaderData` prop (typed in `src/data/resume.ts`).
- The person's name is now the page's `<h1>` — replaces the old `<h1>Resume 2026</h1>` site-title heading, matching the conventional resume pattern (name as primary heading, not the site name).
- Contact details (location, email as a `mailto:` link, phone, an arbitrary `links: ContactLink[]` for GitHub/LinkedIn/portfolio) render as a flat, wrapping list — no columns.
- `location`/`email`/`phone` are AES-GCM ciphertext at rest (not plaintext) and only decrypt client-side when the page is loaded with a `?k=` URL key — see [CONTACT-ENCRYPTION.md](../CONTACT-ENCRYPTION.md) for the full scheme. Without a valid key, those three `<li>`s simply don't render (no ciphertext, no error) — all-or-nothing, decrypted together. `links` anchors carry `rel="noreferrer"` so clicking one from an unlocked page doesn't leak the key via `Referer`.
- First section rendered by `Resume` — see [RESUME.md](RESUME.md) for the overall section-order/data-model/layout rationale shared across all six sections.
