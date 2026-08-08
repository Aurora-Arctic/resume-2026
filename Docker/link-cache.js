#!/usr/bin/env node

// Redirects Gatsby's LMDB-backed cache dir (`.cache/caches-lmdb`) to a directory
// outside the repo's bind mount — see docker-compose.yaml's `gatsby_cache_*`
// volumes and CLAUDE.md's Docker section for why. No-op outside Docker
// (CONTAINER_CACHE_DIR unset), so bare-metal `npm run develop`/`build` are
// unaffected.
//
// `.cache` itself stays a real directory, not a symlink: Gatsby's own
// cache-initialization step copies files into `.cache` using fs-extra, which
// lstats the destination (doesn't follow symlinks) and refuses to "overwrite a
// non-directory" if `.cache` itself is a symlink. Only the LMDB subdirectory
// needs to live off the bind mount, so only it gets symlinked.
//
// Usage: node Docker/link-cache.js ensure|reset
//   ensure — used before develop/build: create the symlink only if missing,
//            leaving an already-correct symlink (and its cached contents) alone.
//   reset  — used after `gatsby clean`: empty the target directory too, so
//            clean still actually clears the cache instead of just re-linking
//            to stale content.

const fs = require('fs');
const path = require('path');

const target = process.env.CONTAINER_CACHE_DIR;
if (!target) {
  process.exit(0);
}

const mode = process.argv[2];
const lmdbLink = path.join('.cache', 'caches-lmdb');

fs.mkdirSync(target, { recursive: true });
fs.mkdirSync('.cache', { recursive: true });

if (mode === 'reset') {
  // Clear the target's *contents* rather than removing the directory itself —
  // target is a Docker volume mount point, and Linux disallows removing a
  // mount point (same class of error link-cache.js exists to avoid for `.cache`).
  for (const entry of fs.readdirSync(target)) {
    fs.rmSync(path.join(target, entry), { recursive: true, force: true });
  }
}

let currentTarget;
try {
  currentTarget = fs.readlinkSync(lmdbLink);
} catch {
  currentTarget = null;
}

if (currentTarget !== target) {
  fs.rmSync(lmdbLink, { recursive: true, force: true });
  fs.symlinkSync(target, lmdbLink, 'dir');
}
