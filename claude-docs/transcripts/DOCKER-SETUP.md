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

## Why `node_modules` is a named volume, not part of the bind mount

Both services bind-mount the repo root to `/app` but use a **named `node_modules` volume** on top of it, so host-installed `node_modules` (potentially built for a different OS/arch) never clashes with the container's own native deps. `builder`'s `npm i` runs as the `node` user, not root — an `EACCES` on `node_modules` in the devcontainer means the named volume predates that fix and is stale; the resolution is recreating it (`docker compose down -v`), not re-patching the Dockerfile.

## Why `Docker/claude-home` is a bind mount, not a named volume

`devcontainer` bind-mounts git-ignored `Docker/claude-home` to `/home/node/.claude`, deliberately as a bind mount rather than a named volume — an earlier attempt used a named volume for this and it was wiped out by a `docker compose down -v` (the same command used to clear stale `node_modules`/`gatsby_cache` volumes above). A bind mount survives that command, since `-v` only removes volumes. If the directory doesn't exist yet, create it yourself (`mkdir Docker/claude-home`) rather than letting Compose auto-create it, since Compose creates missing bind-mount source directories as root-owned.

## OAuth token passthrough

`devcontainer` passes through `CLAUDE_CODE_OAUTH_TOKEN` from git-ignored `Docker/.env`, so the Claude Code CLI inside the container is pre-authenticated without a manual login step. `make docker-up`/`docker-rebuild` regenerate that `.env` via `Docker/update-token.sh` before bringing the container up.
