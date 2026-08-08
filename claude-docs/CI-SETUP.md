# CI Setup — Summary

Full implementation history: [claude-docs/transcripts/CI-SETUP.md](transcripts/CI-SETUP.md)

- Two phase workflows: `pr-gate.yml` (PR → `main` or `staging`) and `merge-queue.yml` (`merge_group`), both composed from small reusable per-check workflows (`lint`, `format`, `typecheck`, `vitest`, `build`, `playwright`, `audit`).
- `staging` gets the same CI/branch-protection treatment as `main`, but via its own repo ruleset ("Staging", mirroring "Main") rather than a `branches:`-list edit — the "Main" ruleset targets the dynamic `~DEFAULT_BRANCH`, and `main` stays the repo's default branch, so it can't also cover `staging` by itself. `staging` is the normal day-to-day PR base (opt-in, not default); `main` is production, updated via periodic `staging` → `main` PRs. Dependabot (`.github/dependabot.yml`) targets `staging` on all three ecosystems, same as human PRs.
- Every check runs inside the Docker `testing` stage via each job's `container:` key; `GITHUB_WORKSPACE` is copied to `/app` via the local composite action `.github/actions/checkout-to-app/`.
- `pr-gate` jobs each have their own `concurrency` group (cancel-in-progress) except `build-image`, which is deliberately `cancel-in-progress: false` — cancelling it mid-push can corrupt the shared, content-addressed GHCR layer cache.
- Path filtering (`dorny/paths-filter`, PR-gate only) skips irrelevant checks on a docs-only or scoped diff. Each job is gated via a `should-run` workflow_call input evaluated inside the job (not a job-level `if:` on the caller) — a job-level `if:` would report the check under a different name and permanently stall required-status checks.
- PR comments and job summaries are built from shared local composite actions: `.github/actions/pr-comment/`, `job-summary/`, `timer-start/`, `timer-elapsed/`.
- Local testing via [`act`](https://github.com/nektos/act): `make act-lint|format|typecheck|vitest|build|playwright|test`. `audit.yml` and `build-image.yml` are excluded.
- Both `npm run test:e2e` and `test:e2e:coverage` build-and-serve on port 8001 by default (`playwright.config.ts`, overridable via `PORT`) — deliberately not Gatsby's usual `:8000` (`npm run develop`/`serve`), so e2e never collides with, or silently reuses, a dev server already running there, in CI or locally alike.
- Enabling the merge queue requires a manual, one-time "Require merge queue" setting in GitHub branch protection — `merge-queue.yml` never triggers without it.
- `.github/dependabot.yml` — weekly PRs for npm deps, GitHub Actions versions, and the Docker base image pin.
