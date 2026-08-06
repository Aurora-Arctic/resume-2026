# CI Setup — Implementation Record

This document is a transcript of the work done to set up GitHub Actions CI for this repo: the approved plan, and how the actual implementation ended up differing from it after some back-and-forth on the `container:`-job mechanics.

## Summary

- Two phase workflows: **`pr-gate.yml`** (`pull_request` → `main`: lint, format check, typecheck, Vitest, build, non-blocking `npm audit` with a single updated PR comment) and **`merge-queue.yml`** (`merge_group`: the same five blocking checks, plus Playwright e2e).
- No push-to-`main` workflow — `merge-queue` already re-verifies everything (including e2e) right before a commit lands, so a post-merge run would just duplicate that coverage.
- Every check is a standalone reusable workflow (`workflow_call`) under `.github/workflows/jobs/`, shared by both phases rather than duplicated per-phase.
- Every check runs inside the repo's existing `testing` Docker stage (`Docker/Dockerfile.node`) — the same image already used for local e2e testing, with Playwright's Chromium and its system libs baked in.
- `.github/dependabot.yml` — weekly updates for `npm`, `github-actions`, and the Docker base image pin.
- `package.json` gained a `typecheck` script (`tsc --noEmit`) since `tsconfig.json` has `noEmit: true` and none existed.
- `CLAUDE.md` got a new "Continuous Integration" section documenting all of the above.
- Repo `mjoynes-wombat-web/resume-2026` is public, so this setup is **$0/month** on the GitHub Free plan regardless of volume (public repos get unlimited free GitHub-hosted-runner minutes; GHCR storage/pulls are currently free for all repos).
- **Manual follow-up required**: "Require merge queue" must be turned on for `main` in Settings → Branches → branch protection — a workflow listening for `merge_group` does nothing until that repo setting is enabled.

## How implementation diverged from the plan

The plan (below) originally called for each check job to run `docker run --rm -v ... -w /app <image> npm run <script>` from a bare `ubuntu-latest` runner, with a separate named Docker volume mounted over `/app/node_modules` to avoid shadowing the image's baked-in install — mirroring `Docker/docker-compose.yaml`'s existing bind-mount pattern.

During implementation this was reworked, after discussion, to use GitHub Actions' native `container:` job key instead — each job's steps run directly inside the image (via `container: image: ..., credentials: ...`), rather than hand-rolling `docker run` invocations. This is simpler and more idiomatic, but it surfaced a real gotcha: `container:` jobs fix `GITHUB_WORKSPACE` at `/github/workspace`, not `/app`, so `actions/checkout` never lands at `/app` no matter what `path:` input is passed to it. The final approach: check out normally, then `cp -a "$GITHUB_WORKSPACE"/. /app/` before running the actual command — `/app` already has `node_modules` from the image's own `npm i` at build time, so nothing needs to reinstall, and the copy (rather than a bind mount) means `/app/node_modules` is naturally preserved since a fresh checkout never contains a `node_modules` directory to overwrite it with.

Everything else in the plan — the phases, triggers, job list, GHCR content-addressed image tagging/caching strategy, dependabot config, and the `typecheck` script addition — was implemented as planned.

## Files created / changed

- `.github/workflows/jobs/build-image.yml` — builds/pushes the `testing` Docker stage to GHCR, tagged by `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`; downstream jobs just pull that tag.
- `.github/workflows/jobs/lint.yml`, `format.yml`, `typecheck.yml`, `vitest.yml`, `build.yml` — each a thin `container:`-based job running one `npm run` script.
- `.github/workflows/jobs/playwright.yml` — same shape, plus `--ipc=host` (Chromium needs more than the container default `/dev/shm`), `CI=true` (read by `playwright.config.ts`'s `webServer.reuseExistingServer`), and a report/`test-results` artifact upload on failure.
- `.github/workflows/jobs/audit.yml` — runs `npm audit --json` non-blocking (`continue-on-error: true`), then uses `actions/github-script` to find-and-update a single marked PR comment (`<!-- ci-audit -->`) rather than posting a new one each run.
- `.github/workflows/pr-gate.yml`, `.github/workflows/merge-queue.yml` — phase workflows composing the job workflows above.
- `.github/dependabot.yml` — `npm` (`/`), `github-actions` (`/`), `docker` (`/Docker`), all weekly.
- `package.json` — added `"typecheck": "tsc --noEmit"`.
- `CLAUDE.md` — new "Continuous Integration" section.

No changes were made to `Docker/Dockerfile.node` or `Docker/docker-compose.yaml` — the existing `testing` stage already had everything CI needed.

## Verification status

YAML syntax for every new workflow file was validated with `js-yaml` (Docker isn't available in the sandbox this was built in, so the image build and `docker run`/container-job behavior itself is unverified). Still to do, per the plan's verification section:

1. Open a draft PR against `main` to confirm `pr-gate.yml` triggers, `build-image` populates GHCR, and all jobs (plus the audit PR comment) succeed.
2. Manually enable "Require merge queue" in branch protection for `main`, then merge that PR through the queue to confirm `merge-queue.yml` triggers off `merge_group` and Playwright passes inside the container.
3. Edit `package-lock.json` or `Dockerfile.node` in a follow-up PR and confirm `build-image` actually rebuilds (new hash → cache miss) rather than silently reusing a stale image.

---

## Approved plan (as written before implementation)

# CI Workflow Setup (GitHub Actions)

## Context

The repo has no CI today (`.github/` doesn't exist) — linting, formatting, typecheck coverage, unit tests, and e2e tests currently only run locally / via the pre-commit hook (`lint`, `format:check`). The user wants GitHub Actions CI with two real phases plus a non-blocking security check, built so each individual check (lint, format, typecheck, vitest, build, playwright, audit) is a standalone reusable unit that both phases can pull from — not duplicated per-phase YAML.

Decisions made with the user:

- **`pr-gate`** (trigger: `pull_request` → `main`): lint, format check, typecheck, vitest, build.
- **`merge-queue`** (trigger: `merge_group`): the same five checks, plus Playwright e2e.
- **No push-to-main workflow** — the merge queue already re-verifies everything (including e2e) right before merge, so a redundant post-merge workflow adds no coverage.
- **Dependency audit**: `npm audit`, PR-only, non-blocking, posts/updates a single PR comment (not a new comment per run).
- **Dependabot**: npm, GitHub Actions, and Docker (`Docker/Dockerfile.node` base image) ecosystems, weekly.
- **Execution environment**: every check runs inside the existing `testing` stage of `Docker/Dockerfile.node` (already bakes in Playwright's Chromium + its system libs — comment in the Dockerfile calls this out as the intended CI use case). No changes to `Dockerfile.node` or `docker-compose.yaml` are needed; CI builds the `testing` target directly.
- **Test runner naming**: the repo uses Vitest (`npm test`), not Jest — the reusable workflow and job name are `vitest`, not `jest`.
- **Reuse mechanism**: reusable workflows (`workflow_call`), one per check, under `.github/workflows/jobs/`. Phase workflows (`pr-gate.yml`, `merge-queue.yml`) just list which job workflows they call.
- **Merge queue must be turned on in repo branch protection settings by the user** — a workflow file alone doesn't enable it. This will be called out explicitly as a manual follow-up step.

## Architecture

### Avoiding redundant image builds

If each of the 6-7 check workflows independently ran `docker build --target testing`, a single PR would trigger that many parallel builds computing the same layers whenever `Dockerfile.node` or `package-lock.json` changes (worst case). Instead:

1. **`.github/workflows/jobs/build-image.yml`** (`workflow_call`, outputs `image`): computes a content-addressed tag via `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`, then:
   - Tries `docker pull ghcr.io/<owner>/<repo>/testing:<hash>`.
   - If that tag doesn't exist yet, builds `Docker/Dockerfile.node` (`--target testing`) with GitHub Actions layer caching (`docker/build-push-action`, `cache-to`/`cache-from: type=gha`) and pushes it to GHCR under that tag.
   - Outputs the full image ref for downstream jobs.
   - Needs `permissions: packages: write`.

   Net effect: identical `Dockerfile.node` + `package-lock.json` → the image is built once (ever, until one of those changes) and every subsequent job in every workflow run just does a fast `docker pull`.

2. Every other job workflow declares a required `image` input (the ref from step 1) and does:
   ```
   docker run --rm \
     -v ${{ github.workspace }}:/app \
     -v <job-specific-volume-name>:/app/node_modules \
     -w /app \
     <image> \
     npm run <script>
   ```
   The separate named volume mounted over `/app/node_modules` mirrors `Docker/docker-compose.yaml`'s existing pattern (bind-mount the repo, but keep `node_modules` in its own volume so the image's baked-in `node_modules` isn't shadowed by the bind mount) — same reason that volume mapping exists today, documented in `CLAUDE.md`. Since the named volume is empty on first use inside a fresh job, Docker seeds it from the image's `/app/node_modules`, so no `npm ci`/`npm i` needs to re-run in CI at all.

### Reusable job workflows (`.github/workflows/jobs/`)

| File              | Command run in container                        | Notes                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build-image.yml` | `docker build --target testing` / `docker pull` | Described above. Called first by both phase workflows.                                                                                                                                                                                                                                                                                                                  |
| `lint.yml`        | `npm run lint`                                  |                                                                                                                                                                                                                                                                                                                                                                         |
| `format.yml`      | `npm run format:check`                          |                                                                                                                                                                                                                                                                                                                                                                         |
| `typecheck.yml`   | `npm run typecheck`                             | New script — see below, tsconfig has `noEmit: true` so no script exists yet.                                                                                                                                                                                                                                                                                            |
| `vitest.yml`      | `npm test`                                      | Vitest, already a single run (`vitest run`), CI-safe as-is.                                                                                                                                                                                                                                                                                                             |
| `build.yml`       | `npm run build`                                 |                                                                                                                                                                                                                                                                                                                                                                         |
| `playwright.yml`  | `npm run test:e2e`                              | Playwright's own `webServer` does `npm run build && npm run serve` internally — no separate build step needed in this job. Upload `test-results/` / `playwright-report/` as a build artifact on failure for debugging.                                                                                                                                                  |
| `audit.yml`       | `npm audit --json` (non-blocking)               | `continue-on-error: true` on the audit step itself. A follow-up step (running on the runner, not in the container) parses the JSON and uses `actions/github-script` to find-and-update a single marked PR comment (`<!-- ci-audit -->`) rather than posting a new one each run. Needs `permissions: pull-requests: write`. Accepts a `pr-number` input from the caller. |

### Phase workflows

- **`.github/workflows/pr-gate.yml`** — `on: pull_request: branches: [main]`. Jobs: `build-image`, then (each `needs: build-image`, running in parallel) `lint`, `format`, `typecheck`, `vitest`, `build`, `audit`.
- **`.github/workflows/merge-queue.yml`** — `on: merge_group`. Jobs: `build-image`, then `lint`, `format`, `typecheck`, `vitest`, `build`, `playwright` (no `audit` — that's PR-only per the user's request).

### `package.json` change

Add a `typecheck` script since none exists and `tsconfig.json` has `noEmit: true`:

```json
"typecheck": "tsc --noEmit"
```

### `.github/dependabot.yml`

Three `updates` entries, each `interval: weekly`:

- `package-ecosystem: npm`, `directory: /`
- `package-ecosystem: github-actions`, `directory: /`
- `package-ecosystem: docker`, `directory: /Docker` (watches the `FROM node:24.18.1` pin in `Dockerfile.node`)

### Documentation

Add a short "CI" section to `CLAUDE.md` (matching how it already documents Docker/testing/linting) covering: the two workflows and their triggers, that all checks run inside the `testing` Docker stage via `build-image.yml`, the audit job is non-blocking, and — most importantly — **that enabling the merge queue itself is a manual one-time step**: repo Settings → Branches → branch protection rule for `main` → enable "Require merge queue", which activates the `merge_group` event these workflows listen for. Without that setting, `merge-queue.yml` will simply never trigger.

## Files to change

- `.github/workflows/jobs/build-image.yml` (new)
- `.github/workflows/jobs/lint.yml` (new)
- `.github/workflows/jobs/format.yml` (new)
- `.github/workflows/jobs/typecheck.yml` (new)
- `.github/workflows/jobs/vitest.yml` (new)
- `.github/workflows/jobs/build.yml` (new)
- `.github/workflows/jobs/playwright.yml` (new)
- `.github/workflows/jobs/audit.yml` (new)
- `.github/workflows/pr-gate.yml` (new)
- `.github/workflows/merge-queue.yml` (new)
- `.github/dependabot.yml` (new)
- `package.json` — add `typecheck` script
- `CLAUDE.md` — add CI section

No changes to `Docker/Dockerfile.node` or `Docker/docker-compose.yaml` — the existing `testing` stage already has everything CI needs.

## Estimated CI cost

Repo `mjoynes-wombat-web/resume-2026` is **public**, so on the GitHub Free plan this setup costs **$0/month** at any volume: public repos get unlimited free minutes on GitHub-hosted runners (the 2,000 min/month quota only applies to private repos), and GHCR image storage/pulls are currently free for all repos, including pulls from within Actions.

For reference, at ~100 builds/month (one `pr-gate` run + one `merge-queue` run per PR cycle), estimated usage is ~8 min/`pr-gate` run + ~10 min/`merge-queue` run ≈ 1,800 minutes/month — still under the 2,000 free minutes/month a private repo would get, but with only ~200 minutes of headroom. Worth revisiting if this repo is ever made private.

## Verification

1. `docker build --target testing -f Docker/Dockerfile.node .` locally — confirm the image still builds standalone (sanity check before wiring it into CI).
2. Locally run each command the way CI will: e.g. `docker run --rm -v $PWD:/app -v tmp-node-modules:/app/node_modules -w /app <built-image> npm run lint` (repeat for `format:check`, `typecheck`, `test`, `build`, `test:e2e`) — confirms the volume-seeding approach actually works before trusting it in CI.
3. Push a branch and open a draft PR against `main` — confirms `pr-gate.yml` triggers, `build-image` populates GHCR, and all five jobs (plus audit's PR comment) succeed.
4. Manually enable "Require merge queue" in branch protection for `main`, then merge the draft PR through the queue — confirms `merge-group.yml` triggers off `merge_group` and Playwright passes inside the container.
5. Edit `package-lock.json` or `Dockerfile.node` in a follow-up PR and confirm `build-image` actually rebuilds (new hash → cache miss) rather than silently reusing a stale image.
