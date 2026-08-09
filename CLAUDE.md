# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal resume site (`resume-2026`) built with Gatsby 5, React 18, and TypeScript. Fully static — no backend, database, or state management.

`claude-docs/` holds a concise, implementation-detail-only summary for specific features/subsystems (currently `LAYOUT-SETUP.md`, `CI-SETUP.md`, and one doc per component under `claude-docs/components/`) — read these for a quick reference on how something was built. The full historical narrative behind each — what was tried, what changed, and why — lives in the matching file under `claude-docs/transcripts/`, kept append-only. **Skip `claude-docs/transcripts/` during normal exploration or planning**; only open a specific transcript when a task genuinely needs that deeper reasoning. When you make further changes to a part of the app one of these already documents, update both: append to the transcript, and refresh the summary if the gist changed.

## Commands

- `npm install` — install dependencies
- `npm run develop` — start the dev server at `http://localhost:8000` (hot reload)
- `npm run build` — production build (outputs to `public/`)
- `npm run serve` — serve the production build locally
- `npm run clean` — clear Gatsby's `.cache` and `public` output directories
- `npm run typecheck` — `tsc --noEmit`; `tsconfig.json` has `noEmit: true` so this is the only way to surface type errors (Oxlint's `typescript` plugin is non-type-checked)
- `npm run lint` — Oxlint over the whole project (`npm run lint:fix` to auto-fix)
- `npm run format` — Prettier write over the whole project (`npm run format:check` for CI-style check without writing)
- `npm test` — run unit/component tests once (Vitest, `npm run test:watch` for watch mode)
- `npm run test:coverage` — `npm test` with coverage collection/enforcement (`vitest run --coverage`) — see Testing below
- `npm run test:e2e` — run Playwright e2e specs (builds and serves the site first; run `npx playwright install` once to fetch browsers — not needed in the `testing`/`devcontainer` Docker images, which bake the chromium binary in)
- `npm run test:e2e:coverage` — `npm run test:e2e` with e2e coverage collection/enforcement — see Testing below
- `npm run pre-commit` — manually run the same checks the pre-commit hook runs (`lint`, `format:check`, `typecheck`, in that order), without having to make a commit
- `npm run analyze` — production build with `ANALYZE_BUNDLE=true`, which makes `gatsby-node.ts`'s `onCreateWebpackConfig` add `webpack-bundle-analyzer` (in `static` mode, not the default long-running `server` mode) to the `build-javascript` webpack config; writes an interactive treemap to `public/bundle-report.html`, doesn't run on a plain `npm run build`

## Linting & Formatting

- **Oxlint** (`.oxlintrc.json`): replaces ESLint. `npm run lint` / `lint:fix`. `overrides` split globals by execution context — Node for `gatsby-config.ts`/`gatsby-node.ts`/`gatsby-ssr.ts`/`vitest.config.ts`/`playwright.config.ts`/`e2e/**`, browser for `src/**`/`gatsby-browser.ts`. Keep new build/test-time files in the Node override.
- **Prettier** (`.prettierrc` + `.prettierignore`): `npm run format` / `format:check`.
- **Pre-commit hook**: the `pre-commit` npm package runs `package.json`'s `"pre-commit"` array (`["lint", "format:check", "typecheck"]`) before every commit. `npm run pre-commit` runs the same three manually — keep both lists in sync if the check list changes.

## Testing

- **Unit/component tests**: Vitest (`vitest.config.ts`, `environment: 'jsdom'`) + React Testing Library, co-located under `src/` (e.g. `src/pages/index.test.tsx`). `vitest.setup.ts` registers RTL's `afterEach(cleanup)` and polyfills `window.localStorage` — Node's own native `localStorage` global shadows jsdom's, so components that touch `localStorage` (e.g. `ThemeToggle`) would otherwise fail under test only.
- **Mocking `gatsby`'s `Link`**: any component under test that renders Gatsby's own `<Link>` (e.g. `404.tsx`) needs it stubbed, since the real one depends on browser-runtime globals jsdom never provides: `vi.mock('gatsby', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }))` — see `src/pages/404.test.tsx`.
- **Integration/e2e tests**: Playwright (`playwright.config.ts`), specs in the root-level `e2e/` directory. Since the site is fully static, `webServer` builds and serves it (`npm run build && npm run serve`) before running against `http://localhost:8001` — deliberately not Gatsby's usual `:8000` (`npm run develop`/`serve`), so e2e's own build-and-serve never collides with, or silently reuses, a dev server already running there; override via `PORT` if 8001 itself is ever occupied.
- **Coverage**: both suites enforce an 80% threshold (lines/branches/functions/statements), wired into CI with a coverage artifact upload. See `claude-docs/CI-SETUP.md` for the collection mechanics and known gaps (e.g. why `404.tsx`'s `<Link>` needs to be a real client-side navigation for e2e coverage of unmount cleanup).
- **Always run the coverage variants** (`npm run test:coverage`, `npm run test:e2e:coverage`) instead of the plain `npm test`/`npm run test:e2e` when verifying changes — CI enforces the threshold either way, so a plain run that passes can still fail CI on coverage alone.

## Docker / Dev Container

- `makefile` wraps Docker Compose (`make docker-build|up|down|rebuild|logs`, targeting `Docker/docker-compose.yaml`) and mirrors the npm scripts one-to-one (`make npm-install|develop|build`, etc.).
- Two Compose services build from `Docker/Dockerfile.node` (multi-stage): `development` (dev server) and `devcontainer` (VS Code Dev Containers). A `testing` stage in between bakes in headless-Playwright/Chromium deps for CI and local e2e.
- Both services bind-mount the repo root to `/app` and use named volumes for `node_modules`, Gatsby's LMDB cache, and Gatsby's `public` output directory, to work around native-dep, file-locking, and shared-output issues on the bind mount — see [claude-docs/DOCKER-SETUP.md](claude-docs/DOCKER-SETUP.md) for what's mounted where and why, including the `EACCES`/stale-volume recovery steps.

## Continuous Integration

- GitHub Actions, `.github/workflows/`. Two phase workflows, each composed from small reusable per-check workflows (`lint`, `format`, `typecheck`, `vitest`, `build`, `playwright`, `audit`, `gitflow`):
  - **`pr-gate.yml`** (`pull_request` → `main`, `staging`, or `release/**`): format check and Gitflow branch-source check (always), plus lint, typecheck, Vitest, build, Playwright e2e, and a non-blocking `npm audit`, each path-filtered to skip when irrelevant.
  - **`merge-queue.yml`** (`merge_group`): the same six blocking checks re-run right before merge, plus a `gitflow` job that runs as a no-op (`should-run: false`) purely to satisfy the `gitflow / gitflow` required status check the merge-queue ruleset shares with pr-gate — the actual source→target validation only makes sense against a PR's real source branch (`merge_group` only exposes a synthetic one); see `claude-docs/CI-SETUP.md`. No `audit` here either; that's PR-only. No push-to-`main` workflow — `merge-queue` already covers that moment.
  - **`gitflow`** enforces which source branches may PR into which targets: `main` accepts `release/MAJOR.MINOR.PATCH`/`hotfix/*`; `staging` accepts `feature/*`/`release/MAJOR.MINOR.PATCH`/`hotfix/*`/`main-sync/YYYY-MM-DD-HH-MM-SS`; `release/*` accepts `staging`/`hotfix/*` — see `claude-docs/CI-SETUP.md`. `.claude/skills/create-pr`/`create-feature`/`create-hotfix`/`create-release`/`create-main-sync` are Gitflow-aware — see `claude-docs/CI-SETUP.md` and its transcript for what each does. `create-main-sync` exists because `main` can end up ahead of `staging` (e.g. a follow-up fix pushed straight to a cut `release/*` branch, which only PRs into `main`) — it branches off `main` as `main-sync/<timestamp>` and opens a PR bringing those commits back down into `staging`.
  - **Enabling the merge queue is a manual, one-time repo setting** ("Require merge queue" in Settings → Branches → branch protection) — without it `merge-queue.yml` never triggers.
- Every check runs inside the `testing` stage of `Docker/Dockerfile.node` via each job's `container:` key — the same image used for local e2e testing. `build-image.yml` builds/pushes that stage to GHCR (skipping the build entirely if the content-addressed tag already exists) and is called first by both phase workflows.
- Local testing via [`act`](https://github.com/nektos/act): `make act-lint|format|typecheck|vitest|build|playwright|test` (host-level only, not devcontainer-integrated). `audit.yml`/`build-image.yml` are excluded.
- See `claude-docs/CI-SETUP.md` for concurrency/caching design, path-filtering mechanics, PR-comment/job-summary formatting, and dependabot config.

## Architecture

- **Routing**: Gatsby's file-system routing — any component under `src/pages/` becomes a route automatically (`index.tsx` → `/`, `404.tsx` → the 404 page). There's no custom router.
- **Shared layout**: `src/components/Layout/index.tsx` wraps page content in the `.paper-chrome`/`.paper-card` shell (dark page background behind an elevated "paper" card) and renders `src/components/ThemeToggle/index.tsx` (see [claude-docs/components/THEME-TOGGLE.md](claude-docs/components/THEME-TOGGLE.md)) and `src/components/BackgroundCredit/index.tsx` (attribution for the card's background texture, see [claude-docs/components/BACKGROUND-CREDIT.md](claude-docs/components/BACKGROUND-CREDIT.md)) inside the card, plus `src/components/RestoreTooltips/index.tsx` (a fixed "I Need Tooltips" button, rendered as a sibling of `.paper-card` rather than inside it, that resets every individually-dismissed tooltip at once — see [claude-docs/components/RESTORE-TOOLTIPS.md](claude-docs/components/RESTORE-TOOLTIPS.md)). Every page in `src/pages/` renders through it — there is no independent per-page markup/styling. See [claude-docs/LAYOUT-SETUP.md](claude-docs/LAYOUT-SETUP.md) for the implementation history (font/color choices and why they changed) behind the general shell — keep it updated as the layout changes further.
- **Resume content**: `src/pages/index.tsx` renders `src/components/Resume/index.tsx` (see [claude-docs/components/RESUME.md](claude-docs/components/RESUME.md)) inside `Layout`, which assembles the six resume section components in reading order — `Header`, `Summary`, `Skills`, `Experience`, `Projects`, `Education` (each documented under `claude-docs/components/`, one doc per component, e.g. [claude-docs/components/HEADER.md](claude-docs/components/HEADER.md)) — from a single typed `resumeData` object in `src/data/resume.ts` (`ResumeData`, still placeholder values pending per-section content tasks). `Resume/index.scss` stacks sections in a single column on both web and print for now, structured so a sidebar/multi-column web layout can be added later without moving any section component — print stays single-column either way, per ATS convention.
- **Contact info encryption**: `HeaderData.location`/`.email`/`.phone` are stored as AES-256-GCM ciphertext (`src/utils/crypto.ts`) rather than plaintext, decrypted client-side only when the page loads with a `?k=` URL key — scraper deterrence, not real confidentiality. The key that decrypts real (non-placeholder) data must never be committed to the repo, including in test fixtures — see [claude-docs/CONTACT-ENCRYPTION.md](claude-docs/CONTACT-ENCRYPTION.md).
- **Light/dark theme toggle**: theme state lives entirely as a `data-theme="light"` attribute on `<html>` (absent = dark, the default) rather than React state, flipped imperatively via the DOM to avoid SSR hydration-mismatch risk. `gatsby-ssr.ts`'s `onRenderBody` injects a synchronous inline `<script>` into `<head>` to prevent a flash of the wrong theme on load. See [claude-docs/components/THEME-TOGGLE.md](claude-docs/components/THEME-TOGGLE.md) for the icon animation mechanics and the [Tooltip](claude-docs/components/TOOLTIP.md) it's wrapped in.
- **Component structure**: every component under `src/components/` lives in its own folder named after it, with an `index.tsx` (so import sites resolve via the folder name alone, e.g. `from '../components/Layout'`), a colocated `index.scss`, and — where tested — an `index.test.tsx` importing `from '.'`.
- **Styling**: `gatsby-plugin-sass` compiles `.scss` imported directly in component files; each component imports its own colocated `index.scss`. `src/scss/` holds only two shared partials, `@use`'d (not the deprecated `@import`): `_variables.scss` (colors, fonts, animation timing) and `_typography.scss` (global `body`/`h1`–`h4`/`p` rules, pulled in only by `Layout/index.scss`). Fonts are self-hosted via `@fontsource/*` imports in `gatsby-browser.ts`, not Google Fonts. See [claude-docs/LAYOUT-SETUP.md](claude-docs/LAYOUT-SETUP.md) for the font/color choices and the SCSS split's history.
- **TypeScript**: `tsconfig.json` has `noEmit: true` — TS is used for type-checking only; Gatsby's internal Babel/Webpack pipeline handles actual transpilation. `strict: true` is enabled.
- **Extension points**: `gatsby-ssr.ts` (theme-flash prevention, see above), `gatsby-browser.ts` (global font CSS imports, see Styling above), and `gatsby-node.ts` (bundle analyzer wiring, see Commands above) are the three SSR/Node/browser hook files `tsconfig.json`'s `include` anticipates — the standard places to add programmatic page creation or browser-side APIs as the site grows beyond static pages.
- **Config**: site metadata and plugins are registered in `gatsby-config.ts` (currently just `gatsby-plugin-sass`).
