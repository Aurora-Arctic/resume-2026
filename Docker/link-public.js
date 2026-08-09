#!/usr/bin/env node

// Redirects Gatsby's `public` output directory to a per-service named Docker
// volume — see docker-compose.yaml's `gatsby_public_*` volumes and
// CLAUDE.md's Docker section for why. No-op outside Docker
// (CONTAINER_PUBLIC_DIR unset), so bare-metal `npm run develop`/`build` are
// unaffected.
//
// Unlike `.cache` (see Docker/link-cache.js), `public` itself is the
// symlink — no need to keep a real parent directory around. Gatsby's clean
// step (`fs-extra.remove('public')`) still can't have a named volume mounted
// directly at `public`, since that ends in an `rmdir` and Linux refuses to
// `rmdir` a mount point. But `public` is a disposable, gitignored build
// artifact rather than something Gatsby must see as a real directory at
// every path it touches, and its one whole-directory copy into `public`
// (`copyStaticDirs` in gatsby/dist/utils/get-static-dir.js) passes
// `{ dereference: true }`, so a symlinked `public` is followed and seen as a
// real directory rather than rejected.
//
// Usage: node Docker/link-public.js ensure|reset
//   ensure — used before develop/build: create the symlink only if missing,
//            leaving an already-correct symlink (and its cached contents) alone.
//   reset  — used after `gatsby clean`: empty the target directory too, so
//            clean still actually clears the output instead of just
//            re-linking to stale content.

const fs = require('fs');
const path = require('path');

const target = process.env.CONTAINER_PUBLIC_DIR;
if (!target) {
  process.exit(0);
}

const mode = process.argv[2];
const publicLink = 'public';

fs.mkdirSync(target, { recursive: true });

if (mode === 'reset') {
  // Clear the target's *contents* rather than removing the directory itself —
  // target is a Docker volume mount point, and Linux disallows removing a
  // mount point (same class of error link-public.js exists to avoid for
  // `public`).
  for (const entry of fs.readdirSync(target)) {
    fs.rmSync(path.join(target, entry), { recursive: true, force: true });
  }
}

let currentTarget;
try {
  currentTarget = fs.readlinkSync(publicLink);
} catch {
  currentTarget = null;
}

if (currentTarget !== target) {
  fs.rmSync(publicLink, { recursive: true, force: true });
  fs.symlinkSync(target, publicLink, 'dir');
}
