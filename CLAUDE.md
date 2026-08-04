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

There is currently no test runner or lint/format tooling configured (no jest/vitest, no eslint/prettier config), despite the devcontainer recommending the ESLint and Prettier VS Code extensions. Don't assume `npm run lint` or `npm test` exist.

## Docker / Dev Container

- `makefile` wraps Docker Compose: `make build`, `make up`, `make down`, `make rebuild`, `make logs` (all target `Docker/docker-compose.yaml`).
- Two Compose services build from `Docker/Dockerfile.node` (multi-stage, `node:24.18.1`):
  - `development` (target `builder`) — runs `npm run develop -- --host 0.0.0.0`, maps port 8000.
  - `devcontainer` (target `devcontainer`) — adds zsh/oh-my-zsh + dev tools, used interactively via VS Code Dev Containers (`.devcontainer/devcontainer.json`, service `devcontainer`, port 8000 forwarded, runs as `node` user).
- Both services bind-mount the repo root to `/app` and use a **named `node_modules` volume** — this keeps host-installed `node_modules` from clashing with container-built native deps. Don't remove this volume mapping without understanding why it's there (see commit "Fixed dev container mounting").

## Architecture

- **Routing**: Gatsby's file-system routing — any component under `src/pages/` becomes a route automatically (`index.tsx` → `/`, `404.tsx` → the 404 page). There's no custom router.
- **Styling**: `gatsby-plugin-sass` (registered in `gatsby-config.ts`) compiles `.scss` imported directly in page components (e.g. `src/pages/index.tsx` imports `../scss/index.scss`). No separate PostCSS/Sass CLI config.
- **TypeScript**: `tsconfig.json` has `noEmit: true` — TS is used for type-checking only; Gatsby's internal Babel/Webpack pipeline handles actual transpilation. `strict: true` is enabled.
- **Extension points**: `tsconfig.json` already anticipates `gatsby-node.ts`, `gatsby-ssr.ts`, and `gatsby-browser.ts` in its `include`, but none exist yet. These are the standard places to add programmatic page creation, SSR customization, or browser-side APIs as the site grows beyond static pages.
- **Config**: site metadata and plugins are registered in `gatsby-config.ts` (currently just `gatsby-plugin-sass`).
