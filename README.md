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

## Available commands

The `npm` column below lists the underlying script — run it inside the `devcontainer` service as shown above. The `make` targets are split into `npm-*` (app/lint/test scripts) and `docker-*` (Docker Compose itself), so `make build` doesn't have to mean either one.

### App

| npm                 | make               | Description                                                   |
| -------------------- | ------------------- | ---------------------------------------------------------------- |
| `npm install`         | `make npm-install`    | Install dependencies                                            |
| `npm run develop`     | `make npm-develop`    | Start the dev server at `http://localhost:8000` (hot reload)    |
| `npm run build`       | `make npm-build`      | Production build (outputs to `public/`)                        |
| `npm run serve`       | `make npm-serve`      | Serve the production build locally                              |
| `npm run clean`       | `make npm-clean`      | Clear Gatsby's `.cache` and `public` output directories         |

### Linting & formatting

| npm                   | make                  | Description                          |
| ---------------------- | ---------------------- | ---------------------------------------- |
| `npm run lint`          | `make npm-lint`         | ESLint over the whole project            |
| `npm run lint:fix`      | `make npm-lint-fix`     | ESLint with auto-fix                     |
| `npm run format`        | `make npm-format`       | Prettier write over the whole project    |
| `npm run format:check`  | `make npm-format-check` | Prettier check (no writes), for CI       |

### Testing

| npm                 | make                | Description                                                  |
| -------------------- | -------------------- | ---------------------------------------------------------------- |
| `npm test`            | `make npm-test`       | Run unit/component tests once (Vitest)                          |
| `npm run test:watch`  | `make npm-test-watch` | Run unit/component tests in watch mode                          |
| `npm run test:e2e`    | `make npm-test-e2e`   | Run Playwright e2e specs (builds and serves the site first)     |

### Docker

| make                | Description                                                                |
| -------------------- | ------------------------------------------------------------------------------ |
| `make docker-build`   | Build the Docker images                                                       |
| `make docker-up`      | Start the `development` service (dev server on port 8000) in the background    |
| `make docker-down`    | Stop the running containers                                                   |
| `make docker-rebuild` | Recreate the containers and volumes from scratch, then start them              |
| `make docker-logs`    | Follow logs from the running containers                                       |

`make docker-up` and `make docker-rebuild` also regenerate the Claude Code OAuth token used by the dev container — see `CLAUDE.md` for details.

## Documentation for contributors

See [CLAUDE.md](CLAUDE.md) for a deeper look at project architecture, linting/testing conventions, and the Docker/dev container setup.
