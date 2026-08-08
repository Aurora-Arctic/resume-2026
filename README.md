# resume-2026

My resume for 2026 made in Gatsby.

A personal resume site built with [Gatsby 5](https://www.gatsbyjs.com/), React 18, and TypeScript. Fully static — no backend, database, or state management.

## Table of contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Debugging](#debugging)
- [Linting & formatting](#linting--formatting)
- [Available commands](#available-commands)
  - [App](#app)
  - [Linting & formatting](#linting--formatting-1)
  - [Testing](#testing)
  - [Docker](#docker)
  - [Local CI testing](#local-ci-testing)
- [Continuous integration](#continuous-integration)
- [Gitflow workflow](#gitflow-workflow)
- [Documentation for contributors](#documentation-for-contributors)

## Prerequisites

[Docker](https://docs.docker.com/get-docker/) (with Compose). This project is developed and run through the Docker Compose setup in `Docker/docker-compose.yaml` — there is no supported host/local Node workflow.

## Getting started

```sh
make docker-up
```

This starts the `development` service and its dev server at `http://localhost:8000` inside a container. Run `make docker-down` to stop it.

For everything else — installing dependencies, linting, testing, building, or any other `npm` command — use the `devcontainer` service instead, either by opening the project in VS Code Dev Containers (see [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)) or by running commands against it directly:

```sh
docker compose -f Docker/docker-compose.yaml run --rm devcontainer npm run lint
```

`npm` commands must run in the `devcontainer` service specifically, not `development` — `development` is built from an earlier Docker stage that's missing dependencies (e.g. Playwright's browser binary and system libs) that some `npm` scripts need. See `CLAUDE.md` for the stage breakdown.

Both services bind-mount the repo into the container, so edits made on the host are picked up immediately.

## Debugging

`.vscode/launch.json` has a **"Chrome: attach to running dev server"** launch configuration for debugging client-side (React) code in VS Code:

1. Start the dev server with `make docker-up` (or `npm run develop` inside the `devcontainer` service) so it's listening on `http://localhost:8000`.
2. Open the Run and Debug panel in VS Code, select **Chrome: attach to running dev server**, and start it. This launches Chrome navigated to `http://localhost:8000` with its debugger attached.
3. Set breakpoints directly in your `.tsx`/`.ts` source files under `src/` — `webRoot` and the `webpack://resume-2026/*` source-map path overrides let Chrome map compiled output back to those files.

This attaches to an already-running dev server rather than launching one itself, so it works the same way whether the server was started via `make docker-up`, the `development` service directly, or `npm run develop` inside the `devcontainer` service.

## Linting & formatting

- **Oxlint** (`.oxlintrc.json`) checks code correctness — a Rust-based linter with built-in `typescript`, `unicorn`, `oxc`, `react` (including hooks rules), and `jsx-a11y` plugins, no separate npm packages needed. Run it with `make npm-lint` (or `npm run lint`, inside the `devcontainer` service), and `make npm-lint-fix` to auto-fix what it can.
- **Prettier** (`.prettierrc`) handles all formatting — Oxlint doesn't ship the kind of low-level formatting rules that would conflict with it, so no bridging config is needed. Run it with `make npm-format` to write changes, or `make npm-format-check` for a check-only pass (no writes) suitable for CI. `.prettierignore` excludes `node_modules`, build output (`public`, `.cache`), and generated files (`package-lock.json`).
- Both tools cover the whole project in one pass — there's no separate config per directory — but `.oxlintrc.json` does split globals by execution context (Node globals for `gatsby-*.ts` build-time files, browser globals for `src/**`).
- **Editor integration**: the `devcontainer` service's VS Code config ([.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)) installs the Oxlint (`oxc.oxc-vscode`) and Prettier (`esbenp.prettier-vscode`) extensions automatically, and sets `editor.formatOnSave` (Prettier) plus `source.fixAll.oxc` as a code action on save — so both run automatically in the editor, not just at commit time via the pre-commit hook.
- **Pre-commit hook**: the [`pre-commit`](https://www.npmjs.com/package/pre-commit) npm package is a devDependency, configured via the `"pre-commit"` field in `package.json` to run `npm run lint`, `npm run format:check`, and `npm run typecheck` before every commit. It registers a real `.git/hooks/pre-commit` hook as part of `npm install`'s install scripts, so it's set up automatically the first time you run `make npm-install` (or plain `npm install`) inside the `devcontainer` service — no separate setup step. A commit is blocked if any check fails; run `make npm-lint-fix` / `make npm-format` to fix what's auto-fixable and try again. Run the same three checks on demand, without committing, via `make npm-pre-commit`.

## Available commands

The `npm` column below lists the underlying script — run it inside the `devcontainer` service as shown above. The `make` targets are split into `npm-*` (app/lint/test scripts) and `docker-*` (Docker Compose itself), so `make build` doesn't have to mean either one.

### App

| npm               | make               | Description                                                  |
| ----------------- | ------------------ | ------------------------------------------------------------ |
| `npm install`     | `make npm-install` | Install dependencies                                         |
| `npm run develop` | `make npm-develop` | Start the dev server at `http://localhost:8000` (hot reload) |
| `npm run build`   | `make npm-build`   | Production build (outputs to `public/`)                      |
| `npm run serve`   | `make npm-serve`   | Serve the production build locally                           |
| `npm run clean`   | `make npm-clean`   | Clear Gatsby's `.cache` and `public` output directories      |

### Linting & formatting

| npm                    | make                    | Description                                                                |
| ---------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `npm run lint`         | `make npm-lint`         | Oxlint over the whole project                                              |
| `npm run lint:fix`     | `make npm-lint-fix`     | Oxlint with auto-fix                                                       |
| `npm run format`       | `make npm-format`       | Prettier write over the whole project                                      |
| `npm run format:check` | `make npm-format-check` | Prettier check (no writes), for CI                                         |
| `npm run pre-commit`   | `make npm-pre-commit`   | Run the pre-commit hook's checks (lint, format check, typecheck) on demand |

### Testing

| npm                         | make                         | Description                                                      |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `npm test`                  | `make npm-test`              | Run unit/component tests once (Vitest)                           |
| `npm run test:watch`        | `make npm-test-watch`        | Run unit/component tests in watch mode                           |
| `npm run test:coverage`     | `make npm-test-coverage`     | Run unit/component tests with coverage (80% threshold, enforced) |
| `npm run test:e2e`          | `make npm-test-e2e`          | Run Playwright e2e specs (builds and serves the site first)      |
| `npm run test:e2e:coverage` | `make npm-test-e2e-coverage` | Run Playwright e2e specs with coverage (80% threshold, enforced) |

See the "Testing" section of [CLAUDE.md](CLAUDE.md#testing) for how coverage is collected/enforced for each, including a real e2e-specific hydration-timing gotcha.

### Docker

| make                  | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `make docker-build`   | Build the Docker images                                                     |
| `make docker-up`      | Start the `development` service (dev server on port 8000) in the background |
| `make docker-down`    | Stop the running containers                                                 |
| `make docker-rebuild` | Recreate the containers and volumes from scratch, then start them           |
| `make docker-logs`    | Follow logs from the running containers                                     |

`make docker-up` and `make docker-rebuild` also regenerate the Claude Code OAuth token used by the dev container — see `CLAUDE.md` for details.

### Local CI testing

The real `.github/workflows/*.yml` files can be run locally with [`act`](https://github.com/nektos/act) before pushing, so failures surface immediately instead of only in PR gate.

**This one is different from every other command on this page: run it on your host machine directly, not inside the `devcontainer` service.** Every job's `container:` key means act's job containers would become siblings on the host Docker daemon rather than nested inside the devcontainer if run from there, breaking bind-mounted paths — so `act` itself, and the setup below, need to run on the host.

**Setup** (once per machine, on the host — not in `devcontainer`):

1. Install `act` via the official install script, targeting `~/.local/bin` (no `sudo` needed — put it wherever you like on `PATH`, this just avoids requiring Homebrew or a Go toolchain):
   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sh -s -- -b "$HOME/.local/bin"
   ```
2. Make sure Docker is running and `docker ps` works from the same host shell `act` will run in — this is your host's Docker (Docker Desktop or engine), unrelated to the `docker-*` targets above.

That's it — `make act-image` (and everything below that depends on it) builds the image `act` runs against from your current working tree, and `.actrc` in the repo root already carries the flags `act` needs. Run the `make act-*` targets themselves from the host too, for the same reason as the setup above. See [CI-SETUP.md](claude-docs/CI-SETUP.md#local-ci-testing-with-act) for the full rationale behind `.actrc` and every workaround below.

| make                  | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `make act-image`      | Build the local image `act` runs jobs against, from the current tree |
| `make act-lint`       | Run `lint.yml` via `act`                                             |
| `make act-format`     | Run `format.yml` via `act`                                           |
| `make act-typecheck`  | Run `typecheck.yml` via `act`                                        |
| `make act-vitest`     | Run `vitest.yml` via `act`                                           |
| `make act-build`      | Run `build.yml` via `act`                                            |
| `make act-playwright` | Run `playwright.yml` via `act`                                       |
| `make act-test`       | Run all six of the above, in order, stopping at the first failure    |

`act-vitest` and `act-playwright` also auto-seed a local cache for `actions/upload-artifact@v7` the first time (each now uploads a coverage-report artifact) — see [CI-SETUP.md](claude-docs/CI-SETUP.md#local-ci-testing-with-act) for why that's needed at all.

`audit.yml` and `build-image.yml` don't have `make` targets and aren't run this way — `audit.yml`'s PR-comment step can't be skipped without editing the file each time (not a repeatable local command), and `build-image.yml` pushes a real image to GHCR, which has no reason to happen from a laptop. See [CI-SETUP.md](claude-docs/CI-SETUP.md#local-ci-testing-with-act) for the full reasoning and the workarounds `playwright.yml` in particular needed.

## Continuous integration

Every pull request against `main`, `staging`, or `release/*` runs **PR gate**: lint, format check, typecheck, Vitest, a production build, the Playwright e2e suite, and a Gitflow branch-source check, plus a non-blocking `npm audit` that posts/updates a single PR comment. Right before a PR actually merges, the **merge queue** re-runs those same blocking checks one more time (except the Gitflow check — see [CI-SETUP.md](claude-docs/CI-SETUP.md) for why), since other PRs may have merged in the meantime. Vitest and Playwright each also enforce an 80% coverage threshold and upload their coverage report as a downloadable artifact — see [CLAUDE.md](CLAUDE.md#testing).

`main` is still the repo's default branch, but `staging` (deployed to a staging subdomain by an external platform outside this repo) is the normal PR target day-to-day. `staging` gets the exact same required checks and merge queue as `main`, via its own repo ruleset. Branches follow a Gitflow-style naming convention, enforced by the Gitflow check: `feature/*` branches PR into `staging`; `staging` is periodically promoted to `main` via a `release/MAJOR.MINOR.PATCH` branch (e.g. `release/1.2.3` — the Gitflow check requires this precise naming, not just any `release/*` name; `hotfix/*` branches can also target `main` or `staging` directly, for urgent fixes). Dependabot's PRs target `staging` too, and are exempted from the Gitflow check's branch-name pattern by PR author (`dependabot[bot]`), since its branch names never match `feature`/`release`/`hotfix`. `.claude/skills/create-feature`, `create-hotfix`, and `create-release` (which also computes the version bump and opens the promotion PR) create these branches with the right naming; `.claude/skills/create-pr` proposes a Gitflow-valid target for whatever branch is currently checked out.

If a check fails, the bot posts (or updates) a single PR comment for that check with the failure output, rather than spamming a new comment per run — a later passing run resolves or removes it. A merge-queue failure is labeled `(merge queue)` and posted as its own comment, separate from any PR-gate comment for the same check, so you can tell which phase actually failed.

For the full breakdown — job/workflow structure, the Docker image checks run inside, and the composite actions the check workflows share — see the "Continuous Integration" section of [CLAUDE.md](CLAUDE.md#continuous-integration). For the history of how it was designed and why (including follow-up changes after the initial setup), see [CI-SETUP.md](claude-docs/CI-SETUP.md).

## Gitflow workflow

This repo follows a Gitflow-style branching model — see [Continuous integration](#continuous-integration) above for the branch rules the required `gitflow` check enforces. A set of Claude Code skills automate the everyday parts of it, so branches and PRs always land with Gitflow-valid names/targets:

| Command             | What it does                                                                                                                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/create-feature`   | Asks for a feature name, then branches off the latest `staging` as `feature/<slug>`.                                                                                                                                                                                                                                        |
| `/create-hotfix`    | Asks for a hotfix name, then branches off the latest `main` as `hotfix/<slug>`.                                                                                                                                                                                                                                             |
| `/create-pr`        | Commits (after asking) and pushes the current branch's work, then opens a PR with a generated summary. Proposes a Gitflow-valid target based on the current branch's prefix (`feature/*` → `staging`, `release/*` → `main`/`staging`, etc.); `hotfix/*` branches automatically get two PRs, into both `main` and `staging`. |
| `/create-release`   | Asks which part of the version to bump (major/minor/patch, default patch), computes the next version from the latest `v*` git tag, creates `release/<version>` off `staging` plus a matching `v<version>` tag, and opens a PR into `main` summarizing every merged-to-staging PR (and its author) included in the release.  |
| `/create-main-sync` | Branches off the latest `main` as `main-sync/<UTC timestamp>` and opens a PR into `staging` summarizing what's included, so commits that landed straight on `main` (e.g. a hotfix) make it back down into `staging`.                                                                                                        |
| `/prune-branches`   | Deletes local branches whose remote counterpart was removed automatically; for local branches that were never pushed, asks which ones to delete and shows what commits each has that the default branch doesn't.                                                                                                            |

A typical flow: `/create-feature` to start work, then `/create-pr` once it's ready for review (targeting `staging`); periodically `/create-release` cuts `staging` into a `release/*` branch and opens the promotion PR into `main`; urgent fixes go through `/create-hotfix` off `main` and also use `/create-pr`, which opens PRs into both `main` and `staging` for you — since that leaves `main` ahead of `staging`, follow up with `/create-main-sync` to bring the hotfix back down. Run `/prune-branches` any time to clear out local branches left behind by merged/closed PRs.

These are only available in Claude Code — each is a skill under `.claude/skills/`, invoked either by name (e.g. `/create-feature`) or by asking in plain language (e.g. "start a new feature branch").

## Documentation for contributors

See [CLAUDE.md](CLAUDE.md) for a deeper look at project architecture, linting/testing conventions, and the Docker/dev container setup.
