# Docker / Dev Container — Implementation Record

This document is a transcript of the reasoning behind the Docker Compose setup for local development and the dev container — in particular, why Gatsby's build cache needed special handling, and why a couple of other mounts are shaped the way they are.

## Why the Gatsby cache needed its own volume

The `development` and `devcontainer` Compose services bind-mount the repo root to `/app`. With Gatsby's `.cache` directory living directly on that bind mount, `gatsby build` intermittently died with an LMDB `No current read transaction available`/`Invalid argument` error — most reliably reproduced by `test:e2e:coverage`'s forced `gatsby clean` + rebuild. Root cause: Docker Desktop's virtualized bind-mount passthrough (shows up as `fakeowner` in `mount` inside the container) doesn't give Gatsby's LMDB-backed cache reliable file-locking semantics across its concurrent build workers.

Two more direct fixes were tried and rejected before landing on the current approach:

1. **Mount a named volume directly at `.cache`.** This does fix the LMDB locking issue, but breaks `gatsby clean` instead: `clean` unconditionally does a full `fs.remove('.cache')`, which ends in an `rmdir`, and Linux never allows `rmdir` on a mount point — surfaces as `EBUSY: resource busy or locked, rmdir '/app/.cache'`, regardless of whether anything else is using the volume.
2. **Symlink the whole `.cache` directory to the volume**, instead of mounting there directly — avoids the `rmdir` problem (`clean` can `unlink` a symlink fine), but breaks the build a different way: Gatsby's own cache-initialization step copies template files into `.cache` via `fs-extra`, which `lstat`s the destination rather than following symlinks, so it sees `.cache` as a "non-directory" and refuses with `Cannot overwrite non-directory '.cache' with directory ...cache-dir`.

**Landed on**: symlink only `.cache/caches-lmdb` — the actual LMDB env directory (`gatsby/dist/utils/cache-lmdb.js`), i.e. the one piece that actually needs off the flaky bind mount — into a named per-service volume mounted at `/gatsby-cache` (`gatsby_cache_development`/`gatsby_cache_devcontainer`, one per service so a long-running `develop` and a `build`/e2e run in the other container never share cache state). `.cache` itself stays a plain real directory, so Gatsby's own template-copy step works normally; `caches-lmdb` being a symlink means `gatsby clean` can still `unlink` it (not `rmdir` a mount point) and keeps working unmodified.

`Docker/link-cache.js` implements this, wired in via `package.json`:

- `predevelop`/`prebuild`/`preanalyze` run it in `ensure` mode — create the symlink only if missing, leaving existing cached content alone.
- `postclean` runs it in `reset` mode — empty `/gatsby-cache`'s _contents_ (not the directory itself, same mount-point-`rmdir` reason `.cache` can't be mounted there directly), so `clean` still actually clears the cache instead of re-linking to stale content.
- The script no-ops when `CONTAINER_CACHE_DIR` is unset, so bare-metal `npm run develop`/`build` outside Docker are unaffected.

Picking this up requires recreating the container (`docker compose down`/`up`, or `make docker-rebuild`) — a container already running from before this was added won't have the volume mounted, and a stale `gatsby_cache` volume from an earlier iteration of the fix (attempts 1 or 2 above) is now orphaned (`docker compose down -v` clears it).

The Dockerfile also pre-creates `/gatsby-cache` with `chown node:node` before `USER node` — a freshly-created named volume is populated from the image's existing content at that path on first mount, ownership included (the same mechanism that makes the `node_modules` volume below work), so without this the mount point defaults to root ownership and Gatsby hits `EACCES` writing into it.

## Why `public` needed its own volume too, and why its fix isn't a copy-paste of `.cache`'s

Same root problem as the cache one, different trigger: `development` and `devcontainer` share one host `public/` directory through the bind mount. `npm run test:e2e:coverage` forces a `gatsby clean`, which does `fs-extra.remove('public')` — deleting it outright. Since it's the same host folder in both containers, running that in `devcontainer` (e.g. for e2e testing) deleted `public` out from under `gatsby develop` running in `development`, breaking it.

The instinct was to reapply the `.cache` fix verbatim — symlink only some nested subdirectory, keep `public` itself a real directory. But `public` has no natural "one hot subdirectory" the way `.cache/caches-lmdb` does, and re-checking whether `.cache`'s specific `lstat`-refusal problem (attempt 2 in the section above) even applies to `public` turned up that it doesn't:

- `gatsby clean` still can't have a named volume mounted directly at `public` — same `rmdir`-on-a-mount-point `EBUSY` as `.cache` (attempt 1 above).
- Gatsby's only whole-directory copy into `public` (`copyStaticDirs` in `gatsby/dist/utils/get-static-dir.js`, copying `static/` → `public/`) passes `fs-extra`'s `copySync`/`copy` an explicit `{ dereference: true }`. That flag makes `fs-extra`'s internal `checkPaths` stat the destination with `fs.statSync` (follows symlinks) instead of `fs.lstatSync` — the opposite of what broke `.cache`'s cache-init copy. A symlinked `public` pointing at a real directory is correctly seen as a directory, not a "non-directory" to refuse overwriting.
- Nothing else writes to `public` as a whole; page-data, webpack output, and HTML rendering all write individual files/directories underneath it via ordinary `fs`/`fs-extra` calls, which follow a symlinked parent fine.

So `public` itself can be the symlink, pointed at a per-service named volume mounted at `/gatsby-public` (`gatsby_public_development`/`gatsby_public_devcontainer`, same one-per-service reasoning as the cache volumes) — no real parent directory needed. `Docker/link-public.js` mirrors `Docker/link-cache.js`'s `ensure`/`reset` modes and `CONTAINER_PUBLIC_DIR` no-op-when-unset behavior, wired into the same `predevelop`/`prebuild`/`preanalyze`/`postclean` hooks (plus reusing the `prebuild` `ensure` call for `serve`, which — like the cache setup — has no `preserve` hook of its own since it always runs right after `build` in the same container). The Dockerfile pre-creates and `chown`s `/gatsby-public` before `USER node`, same reasoning as `/gatsby-cache`.

Landing this requires the same container recreation as any Compose volume change (`docker compose down`/`up`, or `make docker-rebuild`) — a container running from before this was added won't have the new mount.

## Why `node_modules` is a named volume, not part of the bind mount

Both services bind-mount the repo root to `/app` but use a **named `node_modules` volume** on top of it, so host-installed `node_modules` (potentially built for a different OS/arch) never clashes with the container's own native deps. `builder`'s `npm i` runs as the `node` user, not root — an `EACCES` on `node_modules` in the devcontainer means the named volume predates that fix and is stale; the resolution is recreating it (`docker compose down -v`), not re-patching the Dockerfile.

## Splitting `node_modules` per service

That single `node_modules` volume was shared by both `development` and `devcontainer`, the same shape the cache and public volumes started in before their per-service split above. It carries the same underlying risk: `development` runs a long-lived `gatsby develop` that reads `node_modules` continuously (module resolution, webpack/chokidar watching), while the devcontainer is where dependency changes actually happen (`npm install <pkg>`, a Claude Code session editing `package.json`). An install running in one container while the other has `node_modules` open mid-read is the same class of concurrent-mutation problem that motivated isolating the cache and public volumes, just without LMDB's locking to surface it as a named error — it'd more likely show up as `gatsby develop` picking up a half-written package or a transient module-not-found.

Split into `node_modules_development`/`node_modules_devcontainer`, mounted at `/app/node_modules` same as before. No Dockerfile change needed: `/app` is already `chown`ed to `node` before `npm i` runs in `builder`, and both services' images inherit that same populated `node_modules` content through their respective build stages, so a freshly-created volume on either side seeds correctly on first mount — the same image-content-seeds-the-volume mechanism noted for `/gatsby-cache` above.

Requires the same container recreation as any Compose volume change (`docker compose down`/`up`, or `make docker-rebuild`); `docker compose down -v` clears the old shared `node_modules` volume, now orphaned.

## Why `Docker/claude-home` is a bind mount, not a named volume

`devcontainer` bind-mounts git-ignored `Docker/claude-home` to `/home/node/.claude`, deliberately as a bind mount rather than a named volume — an earlier attempt used a named volume for this and it was wiped out by a `docker compose down -v` (the same command used to clear stale `node_modules`/`gatsby_cache` volumes above). A bind mount survives that command, since `-v` only removes volumes. If the directory doesn't exist yet, create it yourself (`mkdir Docker/claude-home`) rather than letting Compose auto-create it, since Compose creates missing bind-mount source directories as root-owned.

## OAuth token passthrough

`devcontainer` passes through `CLAUDE_CODE_OAUTH_TOKEN` from git-ignored `Docker/.env`, so the Claude Code CLI inside the container is pre-authenticated without a manual login step. `make docker-up`/`docker-rebuild` regenerate that `.env` via `Docker/update-token.sh` before bringing the container up.

## `npm run clean` in `devcontainer` was breaking `development`'s live dev server

The "Landed on" design above (symlinking only `.cache/caches-lmdb` out to a named volume, leaving `.cache` itself a plain directory on the shared bind mount) only isolated the LMDB piece. Everything else `.cache` holds — webpack's persistent cache, redux-persisted state, page-data, query results, the schema — stayed on the bind mount, shared by both services. `gatsby clean` (`gatsby/dist/commands/clean.js`) unconditionally does `fs.remove('.cache')` — the _whole_ directory, not just `caches-lmdb`. So running `npm run clean` (or anything that forces it, like `test:e2e:coverage`) in `devcontainer` deleted the entire shared `.cache` out from under `development`'s live `gatsby develop` process, and `postclean`'s `link-cache.js reset` then re-symlinked the shared `.cache/caches-lmdb` to _devcontainer's own_ `/gatsby-cache` volume — cross-wiring `development`'s LMDB pointer onto the wrong container's volume mid-run. `development`'s dev server broke until manually restarted.

Revisited whether either of the two originally-rejected approaches (see "Two more direct fixes were tried and rejected" above) could work now that `clean` no longer has to be Gatsby's own CLI command:

- Attempt 1 (mount a named volume directly at `.cache`) was rejected purely because `gatsby clean`'s own `fs.remove('.cache')` ends in an `rmdir` on the mount point. That's a property of _calling `gatsby clean`_, not of the mount itself — nothing stops the volume mount from working fine for `gatsby develop`/`build`, which never `rmdir` `.cache`, only read/write inside it.
- Attempt 2 (symlink the whole `.cache` dir) is still dead for the reason already found: Gatsby's own cache-init step `lstat`s `.cache` and refuses a symlink there.

So attempt 1 is viable if `npm run clean` stops running Gatsby's own `clean` command when `.cache` is a mount point. `Docker/clean.js` replaces the `"clean"` npm script: when `CONTAINER_CACHE_DIR` is set, it empties `.cache`'s _contents_ by hand (`fs.readdirSync` + `fs.rmSync` each entry, never the directory itself — the same contents-not-directory technique `link-cache.js`/`link-public.js` already used for their `reset` mode) plus the `babel-loader`/`terser-webpack-plugin` caches Gatsby's own `clean.js` also deletes (both live under the already-isolated `node_modules` volume, not mount points themselves, so a plain recursive remove is fine there); when unset, it just execs the real `gatsby clean` — bare-metal is untouched.

With `clean` no longer needing `.cache` to survive being `unlink`-or-`rmdir`-able as a symlink, `gatsby_cache_development`/`gatsby_cache_devcontainer` now mount directly at `/app/.cache` (docker-compose.yaml) instead of at `/gatsby-cache` with a symlinked `caches-lmdb`. This isolates _all_ of `.cache` per service, not just LMDB, so a `clean` in one container can no longer touch the other's cache state at all — closing the gap the original design left open. `Docker/link-cache.js` is deleted (nothing left for it to do — no symlink to maintain); `predevelop`/`prebuild`/`preanalyze` drop their `link-cache.js ensure` call, keeping only `link-public.js ensure` (public's design is unrelated to this bug and unchanged). The Dockerfile's `/gatsby-cache` pre-create/chown step moves to `/app/.cache`, same first-mount-ownership reasoning as before.
