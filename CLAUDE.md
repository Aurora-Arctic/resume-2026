# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal resume site (`resume-2026`) built with Gatsby 5, React 18, and TypeScript. Fully static — no backend, database, or state management.

## Commands

- `npm install` — install dependencies
- `npm run develop` — start the dev server at `http://localhost:8000` (hot reload)
- `npm run build` — production build (outputs to `public/`)
- `npm run serve` — serve the production build locally
- `npm run clean` — clear Gatsby's `.cache` and `public` output directories
- `npm run typecheck` — `tsc --noEmit`; `tsconfig.json` has `noEmit: true` so this is the only way to surface type errors (ESLint's `typescript-eslint` config is non-type-checked)
- `npm run lint` — ESLint over the whole project (`npm run lint:fix` to auto-fix)
- `npm run format` — Prettier write over the whole project (`npm run format:check` for CI-style check without writing)
- `npm test` — run unit/component tests once (Vitest, `npm run test:watch` for watch mode)
- `npm run test:e2e` — run Playwright e2e specs (builds and serves the site first; run `npx playwright install` once to fetch browsers — not needed in the `testing`/`devcontainer` Docker images, which bake the chromium binary in)

## Linting & Formatting

- **ESLint**: `eslint.config.mjs`, flat config (ESLint 9). `typescript-eslint` recommended (non-type-checked — no `parserOptions.project`, kept fast/simple deliberately) + `eslint-plugin-react` (incl. `jsx-runtime` config, since Gatsby 5/React 18 use the automatic JSX transform — no `React` import needed in scope) + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y`. Globals are split by execution context: Node globals for `gatsby-config.ts`/`gatsby-node.ts`/`gatsby-ssr.ts` (these run at build time, not in the browser — `gatsby-ssr.ts` is easy to mistake for client-side code but it isn't), browser globals for `src/**` and `gatsby-browser.ts`. `eslint-config-prettier` is applied last to turn off stylistic rules that would otherwise fight Prettier — ESLint does not run Prettier itself (no `eslint-plugin-prettier`), formatting is a fully separate step.
- **Prettier**: `.prettierrc` (single quotes, trailing commas, 100-char width, LF endings) + `.prettierignore` (`node_modules`, `public`, `.cache`, `package-lock.json`). No plugins — built-in support covers all file types in this repo (`.ts`/`.tsx`/`.scss`/`.json`/`.md`).
- **Pre-commit hook**: the `pre-commit` npm package (devDependency) reads the `"pre-commit"` array in `package.json` (`["lint", "format:check"]`) and runs those two `npm run` scripts before each commit, blocking it on failure. Its `install.js` install script writes `.git/hooks/pre-commit` as part of `npm install` — this is why `pre-commit` needs an approved install script (`allowScripts` in `package.json`) in this sandboxed environment, and why the hook only exists once `npm install` has actually run against a real `.git` directory (i.e. inside the `devcontainer` service against the bind-mounted repo — not during the Docker image build, which only has `package.json`/`package-lock.json` copied in, no `.git`).

## Testing

- **Unit/component tests**: Vitest (`vitest.config.ts`, `environment: 'jsdom'`, `@vitejs/plugin-react` for the automatic JSX runtime) + React Testing Library. Tests are co-located under `src/` (e.g. `src/pages/index.test.tsx`) — this is deliberate, not just convention: it means they're already covered by tsconfig's `./src/**/*` include and by `eslint.config.mjs`'s `BROWSER_FILES` glob (jsdom stands in for the browser environment), so no separate config was needed for them.
- **Integration/e2e tests**: Playwright (`playwright.config.ts`), specs live in the root-level `e2e/` directory. Since the site is fully static, Playwright's `webServer` builds and serves it (`npm run build && npm run serve`) before running against `http://localhost:8000`. `e2e/` runs under Node (Playwright drives an external browser rather than running in it), so it's deliberately kept out of `BROWSER_FILES` — see the `NODE_TOOLING_FILES` glob in `eslint.config.mjs` and the explicit `tsconfig.json` include entries for `playwright.config.ts`/`vitest.config.ts`/`e2e/**/*`.
- Both frameworks use explicit imports (`import { describe, it, expect } from 'vitest'`, `import { test, expect } from '@playwright/test'`) rather than injected test globals, so no `eslint` globals block was needed for the test APIs themselves.

## Docker / Dev Container

- `makefile` wraps Docker Compose: `make docker-build`, `make docker-up`, `make docker-down`, `make docker-rebuild`, `make docker-logs` (all target `Docker/docker-compose.yaml`). It also has `npm-*` targets (`make npm-install`, `make npm-develop`, `make npm-build`, etc.) that wrap the `npm` scripts below one-to-one — both sets of targets are prefixed (`docker-`/`npm-`) so `make build` doesn't have to mean either the Docker image or the Gatsby production build.
- Two Compose services build from `Docker/Dockerfile.node` (multi-stage, `node:24.18.1`):
  - `development` (target `builder`) — runs `npm run develop -- --host 0.0.0.0`, maps port 8000.
  - `devcontainer` (target `devcontainer`) — used interactively via VS Code Dev Containers (`.devcontainer/devcontainer.json`, service `devcontainer`, port 8000 forwarded, runs as `node` user).
- `Dockerfile.node` has a `testing` stage between `builder` and `devcontainer` that installs the shared libs headless Playwright browsers need (`libnspr4`, `libnss3`, etc. — see `npx playwright install-deps`'s own list) and then runs `npx playwright install chromium` to fetch the browser binary itself — chromium only, matching the sole project defined in `playwright.config.ts`. `devcontainer` builds `FROM testing`, so it inherits the libs and browser binary plus its own zsh/oh-my-zsh + dev tools on top. `testing` exists as its own stage so something like CI could target it directly to run `npm run test:e2e` standalone, with no setup step, and without the devcontainer's interactive tooling. Since the binary is baked into the image, only `npm install` populating the named `node_modules` volume remains a one-time-per-volume step (see below) — `npx playwright install` is no longer needed for these images, only for running e2e tests outside of them.
- Both services bind-mount the repo root to `/app` and use a **named `node_modules` volume** — this keeps host-installed `node_modules` from clashing with container-built native deps. Don't remove this volume mapping without understanding why it's there (see commit "Fixed dev container mounting").
- `Dockerfile.node`'s `builder` stage runs `npm i` as the `node` user (via `USER node` before the install), not root — this was fixed after root-owned `npm i` output baked root-owned `node_modules` into the image/volume, breaking `npm install` for anyone working as `node` (the devcontainer's default user) afterward. If you ever see `EACCES` on `node_modules` in the devcontainer, the named volume itself is stale from before this fix — recreate it (`docker compose down -v`, then rebuild) rather than re-patching the Dockerfile.
- The `devcontainer` service passes through `CLAUDE_CODE_OAUTH_TOKEN` so the Claude Code CLI is pre-authenticated on start, sourced from `Docker/.env` (git-ignored — see `Docker/.env.example`). This exists because normal `/login` credentials are stored differently per host OS (a plain file on Linux, but the encrypted Keychain on macOS), so a bind-mounted credentials file only works for Linux hosts; a long-lived token generated via `claude setup-token` on the host works everywhere. `docker compose`'s default project directory is wherever the compose file lives, so the `.env` file must be at `Docker/.env`, not the repo root.
- `make docker-up` and `make docker-rebuild` depend on the `docker-update-token` target, which runs `Docker/update-token.sh` before Docker starts. That script runs `claude setup-token` (an interactive browser OAuth login) on the host every time, extracts the printed `sk-ant-oat...` token, and upserts `CLAUDE_CODE_OAUTH_TOKEN` in `Docker/.env` — so the token is always freshly regenerated before the containers come up. `make docker-build`/`docker-down`/`docker-logs` don't trigger it, since they don't start the `devcontainer` service.

## Continuous Integration

- GitHub Actions, `.github/workflows/`. Two phase workflows, each composed from small reusable workflows (`workflow_call`) under `.github/workflows/jobs/` — `lint.yml`, `format.yml`, `typecheck.yml`, `vitest.yml`, `build.yml`, `playwright.yml`, `audit.yml` — so each check is defined once and shared across phases rather than duplicated per-phase.
  - **`pr-gate.yml`** (`pull_request` → `main`): lint, format check, typecheck, Vitest, build, plus a non-blocking `npm audit` that posts/updates a single PR comment (not a new comment per run).
  - **`merge-queue.yml`** (`merge_group`): the same five blocking checks as `pr-gate`, plus Playwright e2e (deliberately left out of `pr-gate` since it's the slowest check — it only needs to run once more, right before merge). No `audit` here; that's PR-only.
  - There's intentionally no push-to-`main` workflow — `merge-queue` already re-verifies everything (including e2e) immediately before a commit lands, so a post-merge run would just duplicate that coverage.
  - **Enabling the merge queue is a manual, one-time repo setting** — a workflow listening for `merge_group` does nothing until "Require merge queue" is turned on for `main` in Settings → Branches → branch protection. Without it, `merge-queue.yml` never triggers.
- **Execution environment**: every check runs inside the existing `testing` stage of `Docker/Dockerfile.node` (see Docker section above) via each job's `container:` key, not on the bare runner — this is the same image/stage used for local e2e testing, so CI and local Playwright runs behave identically. `.github/workflows/jobs/build-image.yml` builds/pushes that stage to GHCR under a tag derived from `hashFiles('Docker/Dockerfile.node', 'package-lock.json')` and is called first by both phase workflows; unless one of those two inputs changes, every job just pulls the existing tag rather than rebuilding.
- Since `container:` jobs fix `GITHUB_WORKSPACE` at `/github/workspace` (not `/app`), every job workflow checks out normally and then copies that checkout into `/app` (`cp -a "$GITHUB_WORKSPACE"/. /app/`) before running its command — `/app` already has `node_modules` from the image's own `npm i` at build time, so nothing needs to reinstall.
- **Dependabot**: `.github/dependabot.yml` — weekly PRs for `npm` dependencies, `github-actions` versions, and the `docker` base image pin in `Dockerfile.node`.

## Architecture

- **Routing**: Gatsby's file-system routing — any component under `src/pages/` becomes a route automatically (`index.tsx` → `/`, `404.tsx` → the 404 page). There's no custom router.
- **Styling**: `gatsby-plugin-sass` (registered in `gatsby-config.ts`) compiles `.scss` imported directly in page components (e.g. `src/pages/index.tsx` imports `../scss/index.scss`). No separate PostCSS/Sass CLI config.
- **TypeScript**: `tsconfig.json` has `noEmit: true` — TS is used for type-checking only; Gatsby's internal Babel/Webpack pipeline handles actual transpilation. `strict: true` is enabled.
- **Extension points**: `tsconfig.json` already anticipates `gatsby-node.ts`, `gatsby-ssr.ts`, and `gatsby-browser.ts` in its `include`, but none exist yet. These are the standard places to add programmatic page creation, SSR customization, or browser-side APIs as the site grows beyond static pages.
- **Config**: site metadata and plugins are registered in `gatsby-config.ts` (currently just `gatsby-plugin-sass`).
