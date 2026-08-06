# resume-2026

My resume for 2026 made in Gatsby.

A personal resume site built with [Gatsby 5](https://www.gatsbyjs.com/), React 18, and TypeScript. Fully static — no backend, database, or state management.

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

- **ESLint** (`eslint.config.mjs`) checks code correctness — `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y`. Run it with `make npm-lint` (or `npm run lint`, inside the `devcontainer` service), and `make npm-lint-fix` to auto-fix what it can.
- **Prettier** (`.prettierrc`) handles all formatting — ESLint doesn't check style itself; `eslint-config-prettier` disables the ESLint rules that would otherwise conflict with it. Run it with `make npm-format` to write changes, or `make npm-format-check` for a check-only pass (no writes) suitable for CI. `.prettierignore` excludes `node_modules`, build output (`public`, `.cache`), and generated files (`package-lock.json`).
- Both tools cover the whole project in one pass — there's no separate config per directory — but `eslint.config.mjs` does split globals by execution context (Node globals for `gatsby-*.ts` build-time files, browser globals for `src/**`).
- **Editor integration**: the `devcontainer` service's VS Code config ([.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)) installs the ESLint (`dbaeumer.vscode-eslint`) and Prettier (`esbenp.prettier-vscode`) extensions automatically, and sets `editor.formatOnSave` (Prettier) plus `source.fixAll.eslint` as a code action on save — so both run automatically in the editor, not just at commit time via the pre-commit hook.
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
| `npm run lint`         | `make npm-lint`         | ESLint over the whole project                                              |
| `npm run lint:fix`     | `make npm-lint-fix`     | ESLint with auto-fix                                                       |
| `npm run format`       | `make npm-format`       | Prettier write over the whole project                                      |
| `npm run format:check` | `make npm-format-check` | Prettier check (no writes), for CI                                         |
| `npm run pre-commit`   | `make npm-pre-commit`   | Run the pre-commit hook's checks (lint, format check, typecheck) on demand |

### Testing

| npm                  | make                  | Description                                                 |
| -------------------- | --------------------- | ----------------------------------------------------------- |
| `npm test`           | `make npm-test`       | Run unit/component tests once (Vitest)                      |
| `npm run test:watch` | `make npm-test-watch` | Run unit/component tests in watch mode                      |
| `npm run test:e2e`   | `make npm-test-e2e`   | Run Playwright e2e specs (builds and serves the site first) |

### Docker

| make                  | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `make docker-build`   | Build the Docker images                                                     |
| `make docker-up`      | Start the `development` service (dev server on port 8000) in the background |
| `make docker-down`    | Stop the running containers                                                 |
| `make docker-rebuild` | Recreate the containers and volumes from scratch, then start them           |
| `make docker-logs`    | Follow logs from the running containers                                     |

`make docker-up` and `make docker-rebuild` also regenerate the Claude Code OAuth token used by the dev container — see `CLAUDE.md` for details.

## Continuous integration

Every pull request against `main` runs **PR gate**: lint, format check, typecheck, Vitest, a production build, and the Playwright e2e suite, plus a non-blocking `npm audit` that posts/updates a single PR comment. Right before a PR actually merges, the **merge queue** re-runs those same blocking checks one more time, since other PRs may have merged in the meantime.

If a check fails, the bot posts (or updates) a single PR comment for that check with the failure output, rather than spamming a new comment per run — a later passing run resolves or removes it. A merge-queue failure is labeled `(merge queue)` and posted as its own comment, separate from any PR-gate comment for the same check, so you can tell which phase actually failed.

For the full breakdown — job/workflow structure, the Docker image checks run inside, and the composite actions the check workflows share — see the "Continuous Integration" section of [CLAUDE.md](CLAUDE.md#continuous-integration). For the history of how it was designed and why (including follow-up changes after the initial setup), see [CI-SETUP.md](CI-SETUP.md).

## Documentation for contributors

See [CLAUDE.md](CLAUDE.md) for a deeper look at project architecture, linting/testing conventions, and the Docker/dev container setup.
