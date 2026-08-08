# CI Setup — Implementation Record

This document is a transcript of the work done to set up GitHub Actions CI for this repo: the approved plan, and how the actual implementation ended up differing from it after some back-and-forth on the `container:`-job mechanics.

## Summary

- Two phase workflows: **`pr-gate.yml`** (`pull_request` → `main`: lint, format check, typecheck, Vitest, build, Playwright e2e, non-blocking `npm audit` with a single updated PR comment) and **`merge-queue.yml`** (`merge_group`: the same six blocking checks, re-run right before merge — see "Follow-up: run Playwright e2e in pr-gate too" below for why Playwright now runs in both).
- No push-to-`main` workflow — `merge-queue` already re-verifies everything (including e2e) right before a commit lands, so a post-merge run would just duplicate that coverage.
- Every check is a standalone reusable workflow (`workflow_call`) under `.github/workflows/`, shared by both phases rather than duplicated per-phase.
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

Deliberately **not** done: collapsing `lint`/`format`/`typecheck`/`vitest` into one generic parameterized reusable workflow (e.g. a single `npm-check.yml` called four times with different `command`/`check-name`/`marker-slug`/`success-mode` inputs). That would remove the last layer of duplication (the `container:`/`permissions:`/`defaults:` boilerplate each file still repeats, which GitHub Actions has no way to share across separate `workflow_call` files short of merging them), but was explicitly declined — the current one-reusable-workflow-per-check structure stays, since it's simpler to reason about and lets a single check diverge later (as `playwright` already does, with `--ipc=host`, `CI=true`, and an artifact upload step) without adding conditional complexity to a shared file.

All five job files' YAML re-validated with `js-yaml` after the refactor; the `pr-comment` composite action's embedded script was also checked for JS syntax validity (GitHub-expression interpolations stripped, wrapped in an async function) — Docker/GHA runner behavior itself is still unverified in this sandbox, same caveat as "Verification status" below.

## Follow-up: run Playwright e2e in pr-gate too

Playwright previously only ran from `merge-queue`, on the reasoning that it was the slowest check and only needed to run once, right before merge. The user asked for it to also run on every PR (not just right before merge), with PR comments following the same convention as `vitest` — which, conveniently, `playwright.yml` already implemented (`success-mode: comment`, i.e. always comment with the current pass/fail result), since it had been built symmetrically with `vitest.yml` from the start even though nothing called it that way yet. So the change was entirely at the call-site level, no job-workflow logic changes:

- `pr-gate.yml` gained a `playwright` job (`needs: build-image`, passing `image` and `github.event.pull_request.number` as `pr-number`, `merge-queue` omitted so it defaults to `false`) — same shape as its `vitest` job.
- `merge-queue.yml`'s `playwright` job is unchanged — Playwright still re-runs there too, deliberately, since the merge queue can include commits from other PRs merged since `pr-gate` last ran on this one; that duplication is the same reasoning that already applied to `lint`/`format`/`typecheck`/`vitest`/`build` running in both phases.
- The stale comment in `playwright.yml`'s "Comment on PR" step (which called the pr-gate code path "currently unused in practice") was updated to reflect that it's now the primary way Playwright results reach a PR before merge.

## Follow-up: fix `pr-gate` concurrency corrupting the shared `build-image` cache

`pr-gate.yml` gained a workflow-level `concurrency` block (`cancel-in-progress: true`, grouped by PR number) to stop stacked runs piling up when a PR got pushed to repeatedly. This cancelled the _entire_ run on a new push — including `build-image`, mid-`docker buildx build --push`. Since `build-image` writes to a shared, content-addressed GHCR tag and GHA layer cache (`cache-to: type=gha,mode=max`, keyed by `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`), killing it mid-write could freeze a half-written layer into that cache/tag — observed in practice as oxlint's optional native binding going missing (`Cannot find native binding`) in the `lint` job, on a run that hadn't touched any lint-relevant code. Because the tag/cache key doesn't change until the two hashed files do, the corruption didn't self-heal on retry — every subsequent run with the same Dockerfile/lockfile kept reusing the same broken image.

Fixed in two parts:

- **`pr-gate.yml`**: removed the workflow-level `concurrency` block. `lint`, `format`, `typecheck`, `vitest`, `build`, `playwright`, and `audit` each got their own job-level `concurrency` group instead (`pr-gate-<job>-<pr-number>`, `cancel-in-progress: true`) — a new push cancels only that job's own stale run, not the whole graph. `build-image` got a job-level group too, but with `cancel-in-progress: false`: a superseded run's `build-image` queues behind whatever's currently pushing rather than killing it (avoiding the corruption above) or racing it in parallel (avoiding two builds writing the same tag/cache concurrently).
- **`build-image.yml`**: to keep that queue from actually costing wait time in the common case, added a `docker buildx imagetools inspect` check before the build step, and made the build/push step conditional (`if: steps.check.outputs.exists != 'true'`) on that tag not already existing. Most pushes to a PR touch neither `Dockerfile.node` nor `package-lock.json`, so the tag from an earlier run (this PR or `main`) is already in GHCR — the job now just confirms that in a few seconds and exits, with nothing mutable in flight, so it's always safe to cancel/supersede. The `cancel-in-progress: false` queue only bites when a real rebuild is happening, i.e. the hash actually changed — the one case where serializing concurrent identical rebuilds is correct and cheap (it's rare).

`CLAUDE.md`'s CI section was updated to document both the per-job concurrency groups and the existence-check skip.

## Follow-up: prettier, more useful CI labels and comments

Every workflow/action name and every PR comment got a redesign, done in stages (naming, then shared comment plumbing, then per-check content, one check family at a time) so each piece could be reviewed before the next built on it.

**Naming**: workflow YAML has no `description:` schema key (unlike composite/reusable actions, which do) — GitHub rejects a workflow file with an unrecognized top-level property, so a `description:` key was tried and confirmed to break validation before settling on the same fix as everywhere else: a short comment block directly under `name:`, matching the precedent `merge-queue.yml` already had. All 10 workflow names and 3 composite action names were reviewed for Title Case (`PR Gate`, `Format Check`, `Playwright E2E`, etc. — single-word names like `Lint`/`Vitest`/`Build` were already correct either way). While in there, `build-image.yml`'s own job id was renamed from the generic `build` to `build-image`, since it collided with `build.yml`'s `build` job in the Actions UI (both rendered as "<workflow name> / build", only distinguishable by the workflow-name prefix) — its `outputs.image.value` reference was updated to match (`jobs.build-image.outputs.image`), and confirmed nothing else in `.github/` referenced the old `jobs.build.outputs` path from inside that file.

**Shared comment infrastructure**: `.github/actions/pr-comment/` and `.github/actions/job-summary/` gained `summary` (short one-line stat), `details` (optional richer markdown — a failing-test list, a table — rendered between the callout and the log), and `duration` inputs, and their body template moved from a plain `### heading` + "✅/❌ Passed/Failed." line to a GitHub alert-style callout (`> [!NOTE]`/`> [!CAUTION]`) with a metadata line (short commit SHA, duration, link to the full Actions run — SHA/run-id/server-url all come free from `context.*` inside the composite action's own step, no new inputs needed for those). Two more composite actions, `.github/actions/timer-start/` and `.github/actions/timer-elapsed/`, replaced identical inline `date +%s` bash duplicated across `lint`/`format`/`typecheck`/`vitest`/`playwright` (and later `audit`) — split into two actions rather than one, since a single composite action's steps run as one atomic block and can't span before/after another step (the actual "Run <tool>" step) in between.

**Per-check content**, verified against real tool output in the sandbox before being wired into any workflow (an assumption from the original plan — that oxlint and `tsc --noEmit` print their own summary counts — turned out to be wrong; neither does, so counts are derived by grep/regex over the captured log instead):

- `lint`/`typecheck`: a "Summarize output" step parses `file:line:col` findings straight out of the tool's own default log into a count (e.g. "3 errors, 1 warning across 2 files") and a collapsible `<details><summary>Issues</summary>` list, capped at 15 with a "…and N more" note, pointing at the existing raw-log collapsible below it for the rest.
- `format`: same idea, but Prettier's `--check` output only gives file paths, not per-line detail, so the collapsible just lists the non-conforming files.
- `vitest`/`playwright`: switched from parsing the human log to each tool's own **JSON reporter** (`vitest run --reporter=default --reporter=json --outputFile=...`; `playwright test --reporter=list,json,html` with `PLAYWRIGHT_JSON_OUTPUT_NAME` for the JSON path), parsed by two new scripts, `.github/scripts/summarize-vitest.mjs` and `summarize-playwright.mjs` — Vitest's shape is flat (`testResults[].assertionResults[]`), Playwright's nests suites recursively and its `error.message` carries raw ANSI escape codes that get stripped before display. Adding `html` to Playwright's reporter list was a genuine bug fix, not just polish: `playwright.yml`'s "Upload Playwright report" step had been uploading an effectively empty `playwright-report/` all along (confirmed directly — no reporter that writes that directory was ever configured, with or without `CI=true`), so the fix was folded into this stage rather than left for later.
- `audit`: replaced the raw `JSON.stringify` of aggregate severity counts with an always-5-rows severity table plus a collapsible, severity-then-alphabetically-sorted vulnerable-package table (package, severity, `fixAvailable` rendered as `Yes`/`No`/`Yes (pkg@version, major)`), capped at 20 rows. Verified against this repo's own real `npm audit --json` output (40 flagged vulnerabilities at the time) rather than synthetic data. `audit`'s callout uses `[!WARNING]`/⚠️, deliberately not `[!CAUTION]` — the check is explicitly non-blocking, so it shouldn't read with the same urgency as an actual gate failure. `audit.yml` keeps its own inline `actions/github-script` step (not routed through `pr-comment`) and its existing always-update-or-create comment behavior, unchanged — only what it builds and posts got richer.

`CLAUDE.md`'s CI section was rewritten to document all of the above in place, rather than appended to — the naming/comment-format sections replace what they superseded instead of layering a second description on top.

## Follow-up: default all Playwright e2e runs to port 8001, not just `act`

The "Port conflict with a running dev server" workaround above (`make act-playwright` passing `--env PORT=8001`) only ever fixed the collision for `act`'s host-networking mode — a direct `npm run test:e2e`/`test:e2e:coverage` (no `act` involved) still defaulted to `:8000` and would silently reuse whatever was already listening there (`playwright.config.ts`'s `webServer.reuseExistingServer` is `true` outside CI), e.g. a `make docker-up`/`npm run develop` dev server left running in the same devcontainer. That's a real problem for the _coverage_ variant specifically: reusing a dev-mode server instead of building/serving the production bundle changes what gets instrumented, undermining the whole point of the threshold check — worth fixing unconditionally rather than only under `act`, and for both e2e npm scripts rather than coverage alone (a plain `npm run test:e2e` against a stale dev server is just as misleading, e.g. testing against a different in-progress edit than what's actually running there).

Rather than requiring the dev server to be stopped, `playwright.config.ts`'s `port` constant now defaults to `8001` instead of `8000` (`process.env.PORT ?? '8001'`), still overridable via `PORT` for the rare case 8001 itself is occupied. This is the single source of truth — neither npm script sets `PORT` itself. Verified directly: with a dummy server bound to `:8000`, `npm run test:e2e:coverage` still built, served on `:8001`, and passed with correct coverage — no collision, no silent reuse of the wrong server. `make act-playwright`'s `--env PORT=8001` became fully redundant once the config's own default matched it, and was removed. Real CI (`playwright.yml`) picks up the new default automatically since it just runs the npm scripts; its container is a fresh isolated runner so it was never actually at risk of the collision, but it now uses the same `:8001` for consistency — one default instead of an act-only special case. `playwright.yml`'s and `CLAUDE.md`'s inline references to the old hardcoded `:8000` were updated to match.

## Files created / changed

- `.github/actions/pr-comment/action.yml` — composite action for the shared "Comment on PR" logic; see "Follow-up: DRY out the repeated step logic" above.
- `.github/actions/checkout-to-app/action.yml` — composite action for the shared "Checkout" + "Copy checkout into /app" step pair; used by every job workflow below except `build-image.yml`.
- `.github/actions/job-summary/action.yml` — composite action for the shared `$GITHUB_STEP_SUMMARY` pass/fail write; used by `lint`, `format`, `typecheck`, `vitest`, `playwright`.
- `.github/actions/timer-start/action.yml`, `timer-elapsed/action.yml` — added in the "prettier CI labels and comments" follow-up above; used by all six checks (including `audit`) to compute job duration.
- `.github/scripts/summarize-vitest.mjs`, `summarize-playwright.mjs` — added in the same follow-up; parse each tool's JSON reporter output into the `summary`/`details` shown in PR comments and job summaries.
- `.github/workflows/build-image.yml` — builds/pushes the `testing` Docker stage to GHCR, tagged by `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`; downstream jobs just pull that tag.
- `.github/workflows/lint.yml`, `format.yml`, `typecheck.yml` — each a thin `container:`-based job running one `npm run` script, using `checkout-to-app`, `job-summary`, and `pr-comment` (`success-mode: minimize`) for the shared steps.
- `.github/workflows/vitest.yml`, `build.yml` — `vitest.yml` uses the same three composite actions as above, with `pr-comment`'s `success-mode: comment` (its `pr-gate` behavior comments on every run, not just failures); `build.yml` only uses `checkout-to-app` (no job-summary/comment steps — not part of either follow-up round).
- `.github/workflows/playwright.yml` — same shape as `vitest.yml` (including `success-mode: comment`), plus `--ipc=host` (Chromium needs more than the container default `/dev/shm`), `CI=true` (read by `playwright.config.ts`'s `webServer.reuseExistingServer`), and a report/`test-results` artifact upload on failure.
- `.github/workflows/audit.yml` — uses `checkout-to-app`, but keeps its own inline `actions/github-script` comment step rather than `pr-comment` — always update/create with no minimize and no `merge-queue` distinction, a genuinely different shape from the other five, not just a variant of the same one. Predates, and was the model for, the other jobs' comment steps, before they were unified into `pr-comment`.
- `.github/workflows/pr-gate.yml`, `.github/workflows/merge-queue.yml` — phase workflows composing the job workflows above; both now call `playwright.yml` (see "Follow-up: run Playwright e2e in pr-gate too"). `merge-queue.yml` also has the `pr-number`-extraction job described above and passes `merge-queue: true` to all five commenting checks.
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
- **Reuse mechanism**: reusable workflows (`workflow_call`), one per check, under `.github/workflows/`. Phase workflows (`pr-gate.yml`, `merge-queue.yml`) just list which job workflows they call.
- **Merge queue must be turned on in repo branch protection settings by the user** — a workflow file alone doesn't enable it. This will be called out explicitly as a manual follow-up step.

## Architecture

### Avoiding redundant image builds

If each of the 6-7 check workflows independently ran `docker build --target testing`, a single PR would trigger that many parallel builds computing the same layers whenever `Dockerfile.node` or `package-lock.json` changes (worst case). Instead:

1. **`.github/workflows/build-image.yml`** (`workflow_call`, outputs `image`): computes a content-addressed tag via `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`, then:
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

### Reusable job workflows (`.github/workflows/`)

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

- `.github/workflows/build-image.yml` (new)
- `.github/workflows/lint.yml` (new)
- `.github/workflows/format.yml` (new)
- `.github/workflows/typecheck.yml` (new)
- `.github/workflows/vitest.yml` (new)
- `.github/workflows/build.yml` (new)
- `.github/workflows/playwright.yml` (new)
- `.github/workflows/audit.yml` (new)
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

## Local CI testing with `act`

A host-level (not devcontainer-integrated) setup for running the individual job workflows under [`nektos/act`](https://github.com/nektos/act) before pushing, so `lint`/`format`/`typecheck`/`vitest` failures surface locally instead of only in `pr-gate`. This is a separate, host-only workflow from the devcontainer-based `npm`/`make` commands documented in the README — it is not wired into `docker-compose.yaml` or `.devcontainer/`.

Coverage of the seven job workflows under `.github/workflows/`:

| Job                                              | Status                                                                                                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint`, `format`, `typecheck`, `vitest`, `build` | Fully validated via act, repeatable command documented below                                                                                                                                              |
| `playwright`                                     | Fully validated via act (real Playwright run, tests pass), repeatable command documented below                                                                                                            |
| `audit`                                          | `npm audit` portion validated once manually (temporary `if: false` on the comment step, reverted afterward) — not repeatable as-is, since it requires editing the file each time; see "`audit.yml`" below |
| `build-image`                                    | Deliberately out of scope — pushes to GHCR, which has no reason to happen from a laptop; see "Out of scope" below                                                                                         |

### Why host-level, not inside the devcontainer

Running `act` inside the devcontainer via a socket-mounted Docker-outside-of-Docker setup was evaluated and rejected: every job in this repo uses `container:`, and act's job containers become siblings on the host daemon rather than nested inside the devcontainer, so bind-mounted paths don't resolve correctly — a known, recurring class of bug in act specifically for `container:`-type jobs run through a mounted host socket. Running `act` directly on the host keeps host paths and Docker paths consistent and avoids that whole bug class.

### Setup

1. **Install `act`**: no Homebrew or Go toolchain was available on this host, so it was installed via the official install script targeting `~/.local/bin` (already on `PATH`), not `/usr/local/bin`, to avoid needing `sudo`:
   ```
   curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sh -s -- -b "$HOME/.local/bin"
   ```
2. **Confirm host Docker is reachable**: `docker ps` — this is the host's Docker Desktop, unrelated to anything running inside the devcontainer's containers.
3. **Build the `testing` image locally**, from the current working tree — not pulled from GHCR. GHCR's `testing` image is rebuilt fresh on every push and tagged by `hashFiles('Docker/Dockerfile.node', 'package-lock.json')`; pulling a GHCR tag would validate a stale, previously-pushed image rather than the code actually being tested locally:
   ```
   make act-image
   # equivalent to: docker build -f Docker/Dockerfile.node --target testing -t resume-2026-testing:local .
   ```
   Every `make act-*` target below depends on `act-image`, so it's rebuilt (fast, from cache, unless `Dockerfile.node`/`package-lock.json` changed) before every run — no separate step needed day to day.
4. **`.actrc`** (repo root) pins the runner image act needs for job orchestration (the job's _own_ `container:` image is what actually runs the check — the runner image below only hosts act's orchestration layer), and skips re-pulling it every run:
   ```
   -P ubuntu-latest=catthehacker/ubuntu:act-latest
   --pull=false
   ```

### Running a job

Wrapped as `make` targets (see the makefile's `act-*` section) so the full command doesn't need to be retyped:

| make                      | Runs                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make act-image`          | Builds `resume-2026-testing:local` from the current working tree (a prerequisite of every target below, so it's always kept fresh)                 |
| `make act-cache-checkout` | Seeds the `checkout-to-app` action cache the first time (see below); a prerequisite of every target below                                          |
| `make act-lint`           | `lint.yml -j lint`                                                                                                                                 |
| `make act-format`         | `format.yml -j format`                                                                                                                             |
| `make act-typecheck`      | `typecheck.yml -j typecheck`                                                                                                                       |
| `make act-vitest`         | `vitest.yml -j vitest` (also auto-seeds the `actions/upload-artifact@v7` cache the first time — see below — for its coverage-artifact upload step) |
| `make act-build`          | `build.yml -j build`                                                                                                                               |
| `make act-playwright`     | `playwright.yml -j playwright` (also auto-seeds the `actions/upload-artifact@v7` cache the first time — see below — then adds `--env PORT=8001`)   |
| `make act-test`           | All six of the above, in order, stopping at the first failure — the closest local equivalent to `pr-gate`/`merge-queue`'s blocking checks          |

The underlying command each target runs, spelled out (using `lint` as the example — the others swap the `-j` job id and `-W` path):

```
act -W .github/workflows/lint.yml -j lint --input image=resume-2026-testing:local -s GITHUB_TOKEN=dummy-token --action-offline-mode
```

`--input image=...` supplies the `image` input every job workflow requires (normally provided by `build-image.yml`, which is deliberately never run through act — see "Out of scope" below). `-s GITHUB_TOKEN=dummy-token` supplies a placeholder — required because `container.credentials.password` reads `secrets.GITHUB_TOKEN`, and act fails to even start the job if that secret is entirely unset (an empty string doesn't work either — it must be a non-empty value). A placeholder is fine for these jobs since nothing in their own steps calls the GitHub API with it — `playwright.yml`'s artifact-upload step is the one exception, see below. `--action-offline-mode` is needed by every job now (not just `playwright.yml`), because `checkout-to-app` is currently referenced as a remote action — see below.

`pr-number` is deliberately never supplied — per the job workflows' own `if: always() && inputs.pr-number` guard, omitting it skips the PR-comment step (GraphQL calls with nothing real to talk to locally) without needing any workflow changes.

`audit` and `build-image` don't have `make` targets — see "`audit.yml`" and "Out of scope" below for why.

### Real act bugs found and worked around

Getting the composite actions this repo uses (`checkout-to-app`, `job-summary`, `pr-comment`) to resolve at all took a few rounds of debugging. One of these was a real, previously-undiscovered bug in the workflow files themselves, unrelated to act; the rest are genuine, documented `act` limitations:

- **`--bind` was needed while `checkout-to-app` was referenced locally** (`uses: ./.github/actions/checkout-to-app`; every job workflow uses it as its literal first step): without `--bind`, every job failed at that step with `failed to read 'action.yml' from action ... with path '' of step: file does not exist`. Root cause: act's default mode copies the checked-out repo into the job container only once an explicit checkout step actually runs — but act needs to read the composite's own `action.yml` before running any of its steps, i.e. before that checkout has happened (matches [nektos/act#1193](https://github.com/nektos/act/issues/1193), a known recurring regression). `--bind` sidestepped this by mounting the host working directory into the container directly instead of copying it in on a delay. **This is no longer needed**: `checkout-to-app` is currently referenced with a remote `owner/repo/path@main` ref (see below) rather than a local `./` path, and remote actions get resolved via a real git clone regardless of bind/copy mode — so the chicken-and-egg gap this worked around doesn't apply to it anymore. Confirmed by retesting every job with `--bind` removed from `.actrc`; all still pass, including the later steps that use `job-summary`/`pr-comment` (still local `./` refs) — once `checkout-to-app`'s own internal checkout step has run, act can resolve local actions referenced afterward in the same job, bind or no bind.
- **`checkout-to-app` currently resolves as a remote action, needing its own cache seed.** Whatever the reason for this particular reference style, the practical effect for local testing: act clones the real `mjoynes-wombat-web/resume-2026` repo at `ref=main` to resolve it, the same up-front-during-"Set up job" resolution behavior described for `actions/upload-artifact@v4` below, and the same placeholder-token-causes-401 problem (confirmed anonymous host-level clones of this public repo work fine; it's specifically act's use of `secrets.GITHUB_TOKEN` as Basic auth that fails). `make act-cache-checkout` seeds it the same way as the other two caches below — a real git clone (`.git` included) at act's expected path:
  ```
  git clone --branch main https://github.com/mjoynes-wombat-web/resume-2026 ~/.cache/act/mjoynes-wombat-web-resume-2026-.github-actions-checkout-to-app@main
  ```
  Every `make act-*` target depends on this, so it's handled automatically; the raw command is here for what the target does under the hood and as a manual fallback.
- **`shell: bash` needed explicitly in `container:` jobs** — a real bug in the workflow files, not an act artifact: `lint`, `format`, `typecheck`, `vitest`, and `playwright` all failed identically on `set: Illegal option -o pipefail`. Per [GitHub's own docs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/run-jobs-in-a-container), `container:` jobs default to `sh` (dash), unlike normal `runs-on` jobs which default to `bash` — dash doesn't support `set -o pipefail`. Since this CI setup had never actually been exercised against a real PR yet at the time (see "Verification" above), this was a live, undiscovered bug — fixed by adding `shell: bash` to `defaults.run` in all five affected job files.
- **Separately, job workflows must live directly under `.github/workflows/`, not a nested subdirectory** (fixed in commit "Fix workflow file location"; this repo originally had them under `.github/workflows/jobs/`). This is a real GitHub Actions constraint, not an act one — GitHub only discovers workflow files (including `workflow_call` reusable ones referenced via a local `uses: ./...` path) directly in `.github/workflows/`, so the original nested layout would never have actually worked on real GitHub Actions, regardless of what local act testing showed (act didn't catch this, since `act -W <path>` happily runs a workflow file from anywhere you point it).

### A real bug act couldn't catch: EACCES on the real runner

Every check passing under act (including a from-scratch, fully-cleared-cache run) didn't guarantee a real GitHub Actions run would succeed — a real, previously-undiscovered bug in the workflow files only surfaced once run for real:

```
Error: EACCES: permission denied, open '/__w/_temp/_runner_file_commands/save_state_...'
    at Object.appendFileSync (node:fs:2504:6)
    at Object.issueFileCommand (/__w/_actions/actions/checkout/v4/dist/index.js:3345:8)
    at Object.saveState (/__w/_actions/actions/checkout/v4/dist/index.js:3262:31)
```

**Root cause:** none of the job containers specified a `user`, so each ran as the `testing` image's default (`USER node`, uid 1000, set in `Docker/Dockerfile.node`). GitHub's `container:` jobs bind-mount a `_temp/_runner_file_commands` directory from the runner host — used by `actions/checkout` and any JS action calling `core.saveState`/`core.setOutput`/etc. — owned by the runner's own user, not the container image's. A UID mismatch means the container's non-root user can't write there. This is a known class of bug for non-root container images on GitHub Actions, not specific to this repo's setup.

**Why act didn't catch it:** act's own container orchestration doesn't reproduce the real runner's `_temp` bind-mount/ownership model — it has its own `/var/run/act/workflow/...` state paths, unaffected by the container image's `USER`. So this is a genuine fidelity gap between act and real GitHub Actions: a passing `act` run is strong evidence the job's own logic is correct, but not proof the container will have write access to whatever GitHub's real runner mounts in. Worth remembering next time everything's green locally but fails for real.

**Fix:** added `options: --user root` to all seven job files' `container:` key — forces the ephemeral CI container to run as root regardless of the image's default `USER node`. This only affects these CI job containers; `Docker/Dockerfile.node` itself is untouched, so the devcontainer and local `npm run develop`/`test` workflows still run as the non-root `node` user as before.

That fix immediately surfaced two more, each specific to running as root:

- **Playwright's baked-in Chromium went missing.** Running as root changes `$HOME` from `/home/node` to `/root`, but Chromium was installed (`npx playwright install chromium` in `Dockerfile.node`) as the `node` user, under `/home/node/.cache/ms-playwright` — root's `$HOME` has no such directory. First fix attempt: pin `HOME=/home/node` via `-e HOME=/home/node` in every job's `options:`. **This didn't actually work** — see below.
- **Chromium itself refuses to launch as root without `--no-sandbox`.** `playwright.config.ts` didn't pass that. Fixed by adding `launchOptions: { args: ['--no-sandbox'] }`, gated on `process.env.CI` so local/devcontainer runs (non-root, sandboxed) are unaffected — real CI already sets `CI: true` for `playwright.config.ts`'s `webServer.reuseExistingServer`, so this reuses that existing signal rather than adding a new one.

All seven job files re-verified via `act` after these fixes — which passed, and yet the `-e HOME=/home/node` fix still failed on the real runner:

```
Error: browserType.launch: Executable doesn't exist at /github/home/.cache/ms-playwright/chromium_headless_shell-1234/...
```

**Root cause:** GitHub's runner sets `HOME=/github/home` on every job container **unconditionally, at container-create time** — appended after whatever `-e HOME=...` is supplied via `container.options`, so the later, GitHub-controlled value always wins. `-e HOME=/home/node` never actually took effect in real CI, for any of the seven jobs — it only appeared to work under `act`, which doesn't replicate this GitHub-specific override, so it passed every local check while being silently dead in the one place it needed to work.

**Real fix:** stop depending on `$HOME` at all. `Dockerfile.node`'s `testing` stage now bakes `ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` (a fixed, `$HOME`-independent path, `chown`-ed to `node` while still root, set before `RUN npx playwright install chromium`) — Playwright's own documented mechanism for exactly this, and since it's an image-level `ENV` rather than a per-container `-e` flag, it isn't subject to GitHub's `HOME` override (which only ever touches that one variable, not the container's other inherited environment). `-e HOME=/home/node` was removed from all seven job files' `options:` — it was dead configuration with no effect in real CI to begin with.

This is a second instance of the same fidelity gap noted above: a fully green `act` run (even from a cleared cache) doesn't prove a real GitHub Actions run will succeed, specifically for anything that depends on runner-injected environment/mount behavior `act` doesn't reproduce.

### `playwright.yml`: two more local-only workarounds

`build.yml` runs cleanly the same way as the four checks above. `playwright.yml` needed two additional, machine-local workarounds on top of the `checkout-to-app` cache seed and `shell: bash` before it passed end to end — neither changes any committed file beyond the port override below.

**1. Seeding act's action cache for `actions/upload-artifact@v7`.** act evaluates every action a job references up front, during "Set up job" — including `Upload Playwright report` (`uses: actions/upload-artifact@v7`), even though that step only runs `if: failure()`. Unlike `actions/checkout`, which act resolves without a network call, `actions/upload-artifact` isn't special-cased: act does a real HTTPS `git clone`, authenticated with `secrets.GITHUB_TOKEN`. The placeholder token above gets sent as invalid Basic auth and GitHub returns `401` (`authentication required: Invalid username or token`) — confirmed this isn't host-level (`git clone https://github.com/actions/upload-artifact` works anonymously from this machine outside of act) and isn't fixable with an empty-string token (that fails act's own `container.credentials.password` interpolation instead, before the job even starts). Rather than supply a real token, the action was seeded directly into act's local cache — a real git checkout at the `v7` tag (`.git` included; act resolves the ref through it, a flat file copy isn't enough) placed exactly where act's own clone would have gone:

```
git clone --depth 1 --branch v7 https://github.com/actions/upload-artifact ~/.cache/act/actions-upload-artifact@v7
```

Originally seeded at `v4` and only needed by `act-playwright` (its Playwright HTML report upload was the only `upload-artifact` step in any job). Both moved to `v7` (a real Dependabot bump this doc had gone stale on) and `act-vitest` now needs the same seed too, once `vitest.yml` gained its own coverage-artifact upload step. `make act-vitest`/`make act-playwright` both run this automatically now (only if the directory doesn't already exist — see the makefile's shared `act-cache-artifact` target) before invoking act with `--action-offline-mode`, so this doesn't need to be run by hand; included here for what the target is actually doing under the hood, and as a manual fallback if `~/.cache/act` is ever cleared outside of `make`.

**2. Port conflict with a running dev server.** act runs job containers with host networking, so Playwright's `webServer` (`npm run build && npm run serve`, bound to `:8000`) collides with anything already holding that port on the host — e.g. `docker-development-1` (`make docker-up`'s `development` service). Rather than requiring the dev server to be stopped, the port was made overridable: `package.json`'s `serve` script reads `${PORT:-8000}`, and `playwright.config.ts` reads `process.env.PORT` (both default to `8000`, so real CI and a plain `npm run serve` are unaffected). `make act-playwright` passes `PORT=8001` via act's `--env` flag; spelled out:

```
act -W .github/workflows/playwright.yml -j playwright --input image=resume-2026-testing:local -s GITHUB_TOKEN=dummy-token --action-offline-mode --env PORT=8001
```

With both in place, `playwright.yml` runs its actual `playwright test` suite against a real built-and-served site and passes.

### `audit.yml`: one-off validation, not a repeatable command

Unlike the other six job files, `audit.yml` doesn't have an optional `pr-number` / `if: inputs.pr-number`-guarded comment step — `pr-number` is a _required_ input, and its "Comment audit results on PR" step (`actions/github-script@v7`) has no conditional guard at all, so there's no way to exercise just the `npm audit` part through act as-is: it would either fail outright with a fake token, or (with a real one) actually post to a live PR/issue on the public repo. Validated once, manually, rather than added as a standing local command:

1. Temporarily added `if: false` to the "Comment audit results on PR" step in `audit.yml`.
2. act still tried to resolve `actions/github-script@v7` during "Set up job" despite the step being skipped at runtime — the same up-front action-resolution behavior noted for `actions/upload-artifact@v4` above. Seeded it into act's cache the same way:
   ```
   git clone --depth 1 --branch v7 https://github.com/actions/github-script ~/.cache/act/actions-github-script@v7
   ```
3. Ran it:
   ```
   act -W .github/workflows/audit.yml -j audit --input image=resume-2026-testing:local --input pr-number=1 -s GITHUB_TOKEN=dummy-token --action-offline-mode
   ```
   `npm audit` ran and produced real output (this repo does have some existing vulnerabilities in transitive deps — expected, and exactly what this non-blocking check is for). No `shell: bash` fix was needed here; the step's `run:` doesn't use `set -o pipefail`.
4. Reverted the `if: false` — `audit.yml` itself is unchanged from before this validation.

Not added to `.actrc`/documented as a repeatable command because it requires editing the real workflow file each time to skip the comment step — a one-off gut check that the `npm audit` step still works, not something to run before every push the way the other six are.

### Out of scope (deliberately not attempted)

- **`build-image.yml`**: pushes to GHCR, which has no reason to happen from a laptop — the local `docker build --target testing` above replaces it for local testing.
- **`pr-gate.yml` / `merge-queue.yml` as whole graphs**: both start with a `needs: build-image` job that every other job depends on for its `image` input, so running either wholesale would require either running `build-image` (out of scope, see above) or fully faking its output — the individual `-W .github/workflows/<file>.yml -j <job>` invocations above already give equivalent per-check signal without either problem. `merge-queue.yml` additionally triggers on `merge_group`, which has no real local equivalent.
- **PR-comment steps**: never exercised for real (see `pr-number` note above) — nothing real to comment on. `audit.yml`'s non-comment logic was validated once manually — see above.

## Adding a `staging` branch with parity to `main`

The user wanted a `staging` branch: deployed to a staging subdomain by an
external, dashboard-connected platform (confirmed no in-repo deploy config
exists — no `vercel.json`/`netlify.toml`/GitHub Pages — so that wiring
happens outside this repo entirely), taking day-to-day PRs, and getting the
same CI/branch-protection treatment `main` has today. Branch flow: `staging`
takes feature PRs, periodically promotes to `main` (production) via an
ordinary `staging` → `main` PR.

Two decisions came from directly asking the user rather than assuming:

- **`main` stays the GitHub default branch**, `staging` is an opt-in PR base.
  The alternative (making `staging` default) would've made PR creation
  frictionless — no manually picking a base — but at the cost of the repo
  looking like it's showing "production" when browsed on GitHub while
  actually showing in-progress `staging` code. The user chose to keep `main`
  as default and pick `staging` manually per PR.
- **Dependabot was pointed at `staging` too** (`target-branch: staging` added
  to all three `.github/dependabot.yml` ecosystem entries). Initial plan
  left dependabot alone (targeting `main`, the default, since GitHub's
  default `target-branch` behavior follows the default branch) reasoning the
  user only asked about the human PR flow — the user corrected this
  explicitly during plan review: dependency-bump PRs should flow through
  `staging` first like everything else, not merge straight to production.

**Branch protection**: `main`'s existing repo ruleset ("Main", id
`20490347`) targets the dynamic `~DEFAULT_BRANCH` ref-name condition, not a
literal `main` string — since `main` stays default, that ruleset needed no
edit and will keep applying only to it. A **second** ruleset ("Staging"),
targeting `refs/heads/staging` explicitly, mirrors "Main"'s rules exactly
(deletion, non-fast-forward, 0-approval pull_request, merge_queue with the
same ALLGREEN/MERGE parameters, and the same 7 required status checks:
`build / build`, `build-image / build-image`, `format / format`,
`lint / lint`, `playwright / playwright`, `typecheck / typecheck`,
`vitest / vitest`) plus the same always-bypass actor. Attempted via
`gh api repos/Aurora-Arctic/resume-2026/rulesets -X POST` with the mirrored
JSON body — failed with `403 Resource not accessible by personal access
token`: the fine-grained PAT `gh` is authenticated with (visible via
`gh auth status`) lacks repo Administration write, the same permission gap
that made reading `main`'s classic branch-protection endpoint 403 earlier
too (rulesets _listing_, a read, worked fine — only the write failed). Left
as a manual follow-up for the user (either create the ruleset by hand in
Settings → Rules, or grant the token Administration write and re-run the
same `gh api` call).

`pr-gate.yml`'s `pull_request.branches` list gained `staging` alongside
`main` (a plain trigger-list edit, unlike the ruleset — GitHub Actions
`branches:` filters don't have a `~DEFAULT_BRANCH`-style dynamic target).
`merge-queue.yml` needed no trigger change — `on: merge_group` already fires
for whichever branch has "Require merge queue" active, regardless of branch
name — just a comment update.

## Adding Gitflow branch-source enforcement (`feature`/`release`/`hotfix` → `staging`/`main`)

The user asked for a branch-protection flow modeled on [this article's
Gitflow-enforcement pattern](https://medium.com/@ariifischbein/automate-gitflow-branching-rules-with-github-actions-d672f80d335b),
with this repo's `staging` branch standing in for the article's `develop`.
The article's own gap is exactly what motivated this: GitHub branch
protection/rulesets can gate a _target_ branch (required checks, no
force-push, etc.) but can't express "only branch X may merge into target
Y" — nothing already in this repo enforced that, so e.g. a PR from any
random branch straight into `main` was previously unrestricted.

Two decisions came from directly asking the user rather than assuming, since
they change the shape of the whole feature:

- **Full Gitflow (`feature/*`/`release/*`/`hotfix/*`), not a simplified
  staging-only flow.** The repo's existing convention (documented in the
  "Adding a `staging` branch" section above) was `main` promoted via direct
  `staging` → `main` PRs, no release branch, and free-form branch names like
  `mjoynes/<description>` for day-to-day work. The user chose the article's
  full three-branch-type model instead, explicitly accepting that this
  **replaces** the direct `staging → main` promotion path with a
  `release/*` → `main` one, and that existing free-form branch names (e.g.
  `mjoynes/staging-branch-setup`, the very branch this change was made on)
  will fail the new check once it's wired into a ruleset as required — going
  forward, branches feeding `staging`/`main`/`release/*` need Gitflow-style
  prefixes.
- **Blocking, not a warning.** Matches every other required check in this
  repo (lint/format/typecheck/vitest/build/playwright) rather than the
  non-blocking pattern `audit.yml` uses — the user picked blocking
  specifically because it matches the article's own intent (`exit 1` on
  violation) and this repo's existing house style of failing required
  checks rather than just commenting.

Rules enforced (`develop` → `staging` substitution applied to the article's
three rules):

| Target      | Allowed source                       |
| ----------- | ------------------------------------ |
| `main`      | `release/*`, `hotfix/*`              |
| `staging`   | `feature/*`, `release/*`, `hotfix/*` |
| `release/*` | `staging`, `hotfix/*`                |

**Implementation**: a new reusable check, `.github/workflows/gitflow.yml`,
modeled on `format.yml` (the repo's existing "always runs, no path-filter"
pattern) rather than `lint`/`typecheck`/etc., since branch-name validation
has nothing to do with which files changed. Unlike every other check, it
doesn't use the `testing` container or `checkout-to-app` — it only reads
`github.event.pull_request.head.ref`/`base.ref`, no npm/build tooling
involved, so a plain `actions/checkout` (needed only so the job's local
`./.github/actions/...` references resolve) on a bare `ubuntu-latest`
runner is enough. Core logic is a bash `case` over `base.ref` selecting an
allowed-source regex, `exit 1` with a `::error::` annotation on mismatch —
matching the article's own `exit 1`-on-violation approach. Reuses
`job-summary`/`pr-comment` (`success-mode: minimize`) like every other
check, so a violation shows up the same way a lint/format failure does.

Wired into `pr-gate.yml` as an always-run `gitflow` job (job id `gitflow`,
giving the required-check name `gitflow / gitflow` per this repo's
`<job> / <job>` convention). Two other `pr-gate.yml` changes rode along:

- `on.pull_request.branches` gained `'release/**'` (glob, not a literal
  branch name) alongside `main`/`staging`, so `release/*` branches get the
  same full CI (lint/format/typecheck/vitest/build/playwright/audit) plus
  the new gitflow check — they had no CI coverage at all before this.
- `on.pull_request.types` was made explicit (`[opened, synchronize,
reopened, edited]`) — previously left at GitHub's implicit default
  (`opened`/`synchronize`/`reopened`), which doesn't include `edited`. Added
  specifically so retargeting a PR's base branch (the one way a PR's
  gitflow source/target relationship can change without a new push)
  re-triggers this check rather than leaving a stale result in place.

**Deliberately not wired into `merge-queue.yml`.** `merge_group` events only
expose a synthetic head ref
(`refs/heads/gh-readonly-queue/<base>/pr-<n>-<sha>`), not the PR's real
source branch — revalidating there would need an extra API call to resolve
the original PR (the way `merge-queue.yml`'s existing `pr-number` job
already extracts a PR _number_ from that ref, but one step further, an
actual `gh api`/octokit lookup). Skipped as a deliberate simplification:
the `edited` trigger type above already prevents the one scenario
(post-approval retargeting) where the merge queue could otherwise see a
stale gitflow result, so the extra API call would guard against a case that
can no longer happen.

**Manual follow-up left for the user** (same reason as the still-outstanding
"Staging" ruleset above — this session's token can't write repo
Administration settings):

1. Add `gitflow / gitflow` to the existing "Main" ruleset's required status
   checks (only selectable once the check has reported at least once).
2. When creating the still-pending "Staging" ruleset, include
   `gitflow / gitflow` alongside the original 7 required checks.
3. Create a new "Release Branches" ruleset (`refs/heads/release/**`,
   mirroring "Main"/"Staging") — `release/*` had no ruleset of any kind
   before this change.

Docs updated to match: `claude-docs/CI-SETUP.md` (gitflow bullet, `main`
promotion path description), `README.md` (CI section), and `CLAUDE.md`
(fixed a pre-existing stale line that still said `pull_request` → `main`
only — missed by the earlier staging-branch commit, caught while updating
the same section for this change).

## Gitflow-aware branch/PR skills, and requiring precise `release/MAJOR.MINOR.PATCH` naming

Once the `gitflow` check above was live, the existing `.claude/skills/create-pr/SKILL.md`
was still unaware of it — step 3 always defaulted to proposing `main` as the
PR target regardless of the current branch's prefix, which is a guaranteed
`gitflow` failure for e.g. a `feature/*` branch. There was also no skill for
_creating_ correctly-prefixed branches in the first place, only `create-pr`
and `prune-branches`.

**`create-pr` step 3 rewritten** to classify the current branch by Gitflow
prefix and compute its actual valid targets from the same rules table the
check enforces, instead of hardcoding `main`:

- `feature/*` → `staging`, plus any other existing `feature/*` branch — a
  mid-conversation user correction ("feature branches should be able to
  merge into other features") caught that `gitflow.yml`'s `case` statement
  only gates `main`/`staging`/`release/*` targets; any other target
  (including another feature branch) has no source restriction at all, so
  feature-into-feature stacking was already allowed by the check and just
  needed surfacing as a real option.
- `release/*` → `main`, `staging`. `hotfix/*` → `main`, `staging`, and any
  existing `release/*` branch. `staging` itself → existing `release/*`
  branches only. Anything else → no valid target; the skill now says so
  explicitly and asks whether to proceed anyway (accepting the check will
  fail) or stop, rather than silently defaulting to `main`.

**Three new skills**, all following the existing `.claude/skills/<name>/SKILL.md`
convention (two-field frontmatter, numbered `## Steps`, trailing `## Notes`):

- **`create-feature`** / **`create-hotfix`**: ask a free-text name (plain
  conversational question, not AskUserQuestion — no sensible fixed option
  set for a name), slugify it, and branch off the latest `origin/staging`
  (`feature/*`) or `origin/main` (`hotfix/*`) as `<prefix>/<slug>`. Neither
  pushes — that's left to `create-pr`, matching how those two skills only
  ever create local state until the user is ready for review.
- **`create-release`** ended up substantially more involved after two rounds
  of follow-up requests during the same conversation:
  1. First cut: same shape as `create-feature`/`create-hotfix` — free-text
     name, branch off `staging` as `release/<slug>`.
  2. User asked for version bumps instead of free text: AskUserQuestion with
     **Patch (Recommended)** / Minor / Major, computed against the highest
     existing `vMAJOR.MINOR.PATCH` git tag (`git tag --list 'v[0-9]*.[0-9]*.[0-9]*'
--sort=-v:refname`), falling back to `v0.0.0` if none exist yet (true
     for this repo — no tags existed at the time). The skill creates both
     the branch (`release/<version>`, no `v` prefix) and an annotated tag
     (`v<version>`, at the branch's cut point) and — unlike `create-feature`/
     `create-hotfix` — pushes both directly rather than deferring to
     `create-pr`, since a real shared release artifact is the entire point
     of running this skill.
  3. User then asked for it to also open the PR into `main`, and finally to
     have that PR summarize every PR actually merged into `staging` as part
     of the release, with author attribution. Implemented by having the
     skill call `gh pr list --base staging --state merged --json
number,title,author,mergedAt,url,mergeCommit` and, for each, checking
     `git merge-base --is-ancestor <mergeCommit.oid> release/<version>` (in
     the release) and _not_ an ancestor of `origin/main` (not already
     shipped) — deliberately not `git log --merges`, which only sees
     merge-commit-producing PRs and would silently miss anything merged via
     squash or rebase (this repo's ruleset allows all three methods). Each
     matched PR renders as `- [#<number>](<url>) <title> — @<author.login>`
     under a `## Included PRs` section in the generated body, alongside the
     usual `## Summary`/`## Test plan`. If `staging`/`main` are already
     level, PR creation is skipped (nothing to release) but the branch/tag
     are still reported as created.

**`gitflow.yml` tightened** to require the precise naming `create-release`
now always produces: the source-side regex for `release/*` (wherever it's
an allowed source into `main`/`staging`) changed from the loose
`release/.+` to `release/[0-9]+\.[0-9]+\.[0-9]+` — a `release/*` branch not
named exactly `release/MAJOR.MINOR.PATCH` can no longer PR into either. The
target-side `release/*)` case-glob branch (matching _any_ `release/*` name
as a PR target, to decide which check applies) was deliberately left loose
— tightening classification of the target doesn't add safety, only the
source-side check that gates what's allowed to merge does. No ruleset JSON
changes were needed for this — it's a logic change inside the same
`gitflow`/`gitflow` required check, not a new/renamed check.

## `create-pr` on a `hotfix/*` branch opens PRs into both `main` and `staging`

User: "When using /create-pr on a hotfix branch it should create a PR for
both main and staging."

Before this, `create-pr` step 3 treated `hotfix/*` the same as any other
prefix with multiple valid Gitflow targets (`main`, `staging`, and any
existing `release/*` branch) — it would ask via AskUserQuestion and open
exactly one PR, whichever the user picked. That undersells what a hotfix
actually is: standard Gitflow has a hotfix land in production _and_ get
folded back into the mainline development branch, so a single PR always
left one of the two out of date until someone remembered to open a second
one by hand.

Before implementing, asked the user whether the existing `release/*`
option (offered for hotfixes because `gitflow.yml` also allows `hotfix/*`
into `release/*`) should survive alongside the new automatic main+staging
pair, or be dropped now that hotfix PR creation is non-interactive. User
chose to drop it — a hotfix branch now always produces exactly two PRs
(`main`, `staging`), no question asked, no third option. If a release branch
in flight also needs the fix, that's outside this skill's flow now (open
one by hand, or reconsider whether it should really be a `hotfix/*` in the
first place).

Implementation: step 3 special-cases `hotfix/*` up front — skips
AskUserQuestion, sets targets to the pair `main`+`staging`, and notes the
rest of the skill (steps 5-8) now iterates "per target" wherever it
previously assumed a single one:

- Step 2's existing-PR lookup gained `baseRefName` to the `gh pr list`
  `--json` fields, so step 8 can match an existing open PR to the correct
  target instead of assuming there's at most one open PR for the branch.
- Step 5 (push) stayed a single action — pushing is about the source
  branch's own commits, not per-target — but its "anything to push" check
  now explicitly reasons about using `main` as the representative
  comparison for the hotfix case (a hotfix always branches off `main`, so
  "ahead of `main`" is a reliable stand-in for "has any work at all"),
  leaving the real per-target diffing to step 6.
- Step 6 (gather context) now runs its diff/log once per target — for a
  hotfix that's once against `main` and once against `staging`, since the
  two frequently differ (`staging` may already contain commits `main`
  doesn't). If a target's diff comes back empty the skill skips opening a
  PR for that target and says why, rather than opening an empty one; the
  other target still proceeds independently.
- Steps 7-8 (draft, create/update) run once per target, each summarized
  from its own diff, each checked/created/updated independently.

No `gitflow.yml` changes were needed — the check itself already allowed
`hotfix/*` into both `main` and `staging` individually; this was purely a
`create-pr` skill-level change to stop making the user choose one.
