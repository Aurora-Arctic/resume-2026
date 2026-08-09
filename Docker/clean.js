#!/usr/bin/env node

// Replaces `gatsby clean` when `.cache` is a Docker named-volume mount point
// (CONTAINER_CACHE_DIR set — see docker-compose.yaml and CLAUDE.md's Docker
// section). Gatsby's own clean (gatsby/dist/commands/clean.js) unconditionally
// `fs.remove()`s `.cache`, which ends in an `rmdir`, and Linux refuses to
// `rmdir` a mount point — surfaces as `EBUSY: resource busy or locked`. So
// instead of running `gatsby clean` at all in that case, this replicates its
// effect by hand: empty `.cache`'s *contents* (not the directory itself, same
// mount-point-`rmdir` reason `.cache` can't be recreated from scratch), plus
// the babel-loader/terser-webpack-plugin caches gatsby clean also removes
// (both live under node_modules, which is its own isolated volume, not a
// mount point itself, so a plain recursive remove is fine there).
//
// `public` deliberately isn't handled here — it's a symlink (see
// Docker/link-public.js), so gatsby clean's `fs.remove('public')` just
// unlinks it, which was never at risk the way `.cache` is; npm's `postclean`
// lifecycle hook still runs `link-public.js reset` afterward regardless of
// how this script implements `clean`.
//
// Outside Docker (CONTAINER_CACHE_DIR unset), just run the real `gatsby
// clean` — bare-metal `npm run clean` is unaffected.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const cacheDir = process.env.CONTAINER_CACHE_DIR;

if (!cacheDir) {
  const result = spawnSync('npx', ['gatsby', 'clean'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}

fs.mkdirSync('.cache', { recursive: true });
for (const entry of fs.readdirSync('.cache')) {
  fs.rmSync(path.join('.cache', entry), { recursive: true, force: true });
}

for (const cacheName of ['babel-loader', 'terser-webpack-plugin']) {
  fs.rmSync(path.join('node_modules', '.cache', cacheName), { recursive: true, force: true });
}
