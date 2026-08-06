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

## Follow-up: per-check PR comments and job summaries

After the initial setup landed, `lint`, `format`, `typecheck`, `vitest`, and `playwright` each gained a result-reporting step, modeled on the pattern `audit.yml` already used (single marked comment, updated in place rather than reposted). The exact behavior needed a couple of rounds of clarification:

- **`lint`, `format`, `typecheck`**: comment on the PR only when they fail. On a later success, that failure comment isn't just edited or deleted — it's minimized via GitHub's own resolve mechanism (`minimizeComment` GraphQL mutation, `classifier: RESOLVED`), matching what "closing" a comment means in GitHub's own terms rather than an ad hoc convention. Confirmed via GitHub's public GraphQL schema that a corresponding `unminimizeComment` mutation exists too — used so a fresh failure after a resolved state reopens the same comment instead of leaving it hidden with stale content or spawning a duplicate.
- **`vitest`, `playwright`**: always comment with the current result (pass or fail), updating the same comment on every re-run. Since these are never minimized by our own logic, the only way one could be minimized is a maintainer manually hiding it via the GitHub UI — so as a defensive measure, every update also attempts `unminimizeComment` first (ignoring the error if it wasn't minimized) to guarantee the latest result stays visible.
- All five unconditionally write a pass/fail section (with a trailing log excerpt on failure) to `$GITHUB_STEP_SUMMARY`, regardless of PR-comment outcome — this surfaces in the workflow run's own Summary page for both `pr-gate` and `merge-queue` runs.
- Each of the five reusable workflows gained an optional `pr-number` input; the PR-comment step only runs when one is supplied (`if: always() && inputs.pr-number`), so the same job workflow behaves identically whether or not a PR context exists.
- `pr-gate.yml` passes `github.event.pull_request.number` through to `lint`, `format`, `typecheck`, and `vitest` (`audit` already had this).
- `merge_group` events don't carry a plain PR number the way `pull_request` events do — it's embedded in the merge group's ref instead (`refs/heads/gh-readonly-queue/<base>/pr-<number>-<sha>`). `merge-queue.yml` gained a small `pr-number` job that regex-extracts it once and passes it to all five checks (including `playwright`, which only ever runs via the merge queue), so PR commenting works there too, not just from `pr-gate`.

## Follow-up: merge-queue comments now fail-only, on a separate thread from pr-gate

The `vitest`/`playwright` always-comment behavior above meant a `merge-queue` run posted a "✅ Passed" comment for every successful pre-merge check, on top of whatever `pr-gate` had already posted — noisy, and since `vitest.yml` shares a single comment marker between callers, a `merge-queue` result could silently overwrite a `pr-gate` comment for the same check (or vice versa) with no indication of which phase produced it. Fixed by adding a `merge-queue` boolean input (default `false`) to all five checks that comment (`lint`, `format`, `typecheck`, `vitest`, `playwright`), set to `true` only by `merge-queue.yml`'s calls:

- With `merge-queue: true`, every check now comments **only on failure**. A success takes no action at all — no comment, and (unlike the `pr-gate` fail-only checks) no minimizing of a prior open failure comment either, since the user wants absence-of-comment to be the sole failure signal for merge-queue runs, without added resolve-tracking logic.
- Each check uses a distinct comment marker in `merge-queue` mode (e.g. `<!-- ci-vitest-mergequeue -->` vs. plain `<!-- ci-vitest -->`) and a "(merge queue)" heading suffix, so a merge-queue failure is always its own comment thread — never confused with, or clobbering, a `pr-gate` comment for the same check.
- `pr-gate.yml`'s calls are unaffected (`merge-queue` input just defaults to `false`), so `lint`/`format`/`typecheck`'s existing fail-only-with-minimize-on-success behavior and `vitest`'s existing always-comment behavior are unchanged there. `playwright` never runs from `pr-gate` today, but picked up the same `merge-queue` input for symmetry with `vitest`, in case that changes later.

## Follow-up: DRY out the repeated step logic into composite actions

The `merge-queue` input above made the per-file `actions/github-script` "Comment on PR" blocks diverge slightly (marker, heading, success handling) across all five checks, which made the existing near-identical ~100-line blocks in `lint.yml`/`format.yml`/`typecheck.yml`/`vitest.yml`/`playwright.yml` harder to keep in sync by hand — a change to one had to be manually mirrored in the other four. Three local composite actions were pulled out to fix this, each replacing a block that was byte-for-byte (or near enough) identical across multiple job files:

- **`.github/actions/pr-comment/`** — the "Comment on PR" step. Takes `check-name`, `marker-slug`, `pr-number`, `merge-queue`, `outcome`, `log-file`, and `success-mode` (`minimize` for `lint`/`format`/`typecheck`, `comment` for `vitest`/`playwright`) as inputs, and implements the full marker/heading/minimize/unminimize/upsert logic once. Verified the unified script produces byte-identical behavior to each of the five original inline blocks for all four (pr-gate/merge-queue) × (success/failure) combinations before replacing them.
- **`.github/actions/checkout-to-app/`** — the "Checkout" + "Copy checkout into /app" step pair, identical across all seven job workflows (`build`, `lint`, `format`, `typecheck`, `vitest`, `playwright`, `audit`) since `container:` jobs fix `GITHUB_WORKSPACE` at `/github/workspace`, not `/app`. `build-image.yml` doesn't use it — that workflow builds the `testing` image itself, so it isn't running inside a `container:` pinned to it.
- **`.github/actions/job-summary/`** — the `$GITHUB_STEP_SUMMARY` pass/fail write, identical across `lint`/`format`/`typecheck`/`vitest`/`playwright` apart from the check's display name. Takes `check-name`, `outcome`, `log-file`.

Deliberately **not** done: collapsing `lint`/`format`/`typecheck`/`vitest` into one generic parameterized reusable workflow (e.g. a single `jobs/npm-check.yml` called four times with different `command`/`check-name`/`marker-slug`/`success-mode` inputs). That would remove the last layer of duplication (the `container:`/`permissions:`/`defaults:` boilerplate each file still repeats, which GitHub Actions has no way to share across separate `workflow_call` files short of merging them), but was explicitly declined — the current one-reusable-workflow-per-check structure stays, since it's simpler to reason about and lets a single check diverge later (as `playwright` already does, with `--ipc=host`, `CI=true`, and an artifact upload step) without adding conditional complexity to a shared file.

All five job files' YAML re-validated with `js-yaml` after the refactor; the `pr-comment` composite action's embedded script was also checked for JS syntax validity (GitHub-expression interpolations stripped, wrapped in an async function) — Docker/GHA runner behavior itself is still unverified in this sandbox, same caveat as "Verification status" below.

## Files created / changed

- `.github/actions/pr-comment/action.yml` — composite action for the shared "Comment on PR" logic; see "Follow-up: DRY out the repeated step logic" above.
- `.github/actions/checkout-to-app/action.yml` — composite action for the shared "Checkout" + "Copy checkout into /app" step pair; used by every job workflow below except `build-image.yml`.
- `.github/actions/job-summary/action.yml` — composite action for the shared `$GITHUB_STEP_SUMMARY` pass/fail write; used by `lint`, `format`, `typecheck`, `vitest`, `playwright`.
- `.github/workflows/jobs/build-image.yml` — builds/pushes the `testing` Docker stage to GHCR, tagged by `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`; downstream jobs just pull that tag.
- `.github/workflows/jobs/lint.yml`, `format.yml`, `typecheck.yml` — each a thin `container:`-based job running one `npm run` script, using `checkout-to-app`, `job-summary`, and `pr-comment` (`success-mode: minimize`) for the shared steps.
- `.github/workflows/jobs/vitest.yml`, `build.yml` — `vitest.yml` uses the same three composite actions as above, with `pr-comment`'s `success-mode: comment` (its `pr-gate` behavior comments on every run, not just failures); `build.yml` only uses `checkout-to-app` (no job-summary/comment steps — not part of either follow-up round).
- `.github/workflows/jobs/playwright.yml` — same shape as `vitest.yml` (including `success-mode: comment`), plus `--ipc=host` (Chromium needs more than the container default `/dev/shm`), `CI=true` (read by `playwright.config.ts`'s `webServer.reuseExistingServer`), and a report/`test-results` artifact upload on failure.
- `.github/workflows/jobs/audit.yml` — uses `checkout-to-app`, but keeps its own inline `actions/github-script` comment step rather than `pr-comment` — always update/create with no minimize and no `merge-queue` distinction, a genuinely different shape from the other five, not just a variant of the same one. Predates, and was the model for, the other jobs' comment steps, before they were unified into `pr-comment`.
- `.github/workflows/pr-gate.yml`, `.github/workflows/merge-queue.yml` — phase workflows composing the job workflows above; `merge-queue.yml` also has the `pr-number`-extraction job described above and passes `merge-queue: true` to all five commenting checks.
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
