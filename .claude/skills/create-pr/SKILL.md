---
name: create-pr
description: Use when the user asks to open a PR, create a pull request, or wrap up the current branch for review (e.g. "create a PR", "open a PR for this", "let's get this reviewed"). Commits (after asking) and automatically pushes the current branch's work, then opens a PR with a generated summary of the work done — proposes a target branch based on the repo's Gitflow rules for the current branch's prefix (feature/release/hotfix/staging); `hotfix/*` branches automatically get two PRs, into both `main` and `staging`.
---

# create-pr

Turn the current branch's work into a pull request against a Gitflow-appropriate target, asking before any commit. Pushing happens automatically once there's something to push. `hotfix/*` branches are a special case: since a hotfix must land in both production and the mainline, this opens two PRs (into `main` and into `staging`) rather than asking for one target.

## Steps

1. **Verify GitHub authentication.**
   - Run `gh auth status` to check whether credentials are valid. This is a read-only check — safe to run every time and cheap enough not to skip.
   - Only if it reports not-logged-in or invalid/expired credentials, authenticate: `gh auth login --hostname github.com --git-protocol ssh --skip-ssh-key --with-token <<< "$GITHUB_PERSONAL_ACCESS_TOKEN"`. Run this directly — don't check whether `$GITHUB_PERSONAL_ACCESS_TOKEN` is set first, just attempt the login. Non-interactive — completes immediately, nothing for the user to do.
   - Never use the `--web` (browser/device-code) flow — always `--with-token`.
   - Don't run `gh auth login` at all when already authenticated — it's unnecessary and interrupts the user for no reason.
   - Don't re-run `gh auth status` (or any other verification) after `gh auth login` completes — trust that a successful login means auth is good, and move straight on to step 2.

2. **Check preconditions.**
   - Run `git branch --show-current`. Note it as the source branch.
   - Run `git status`, `git diff`, and `git branch -a` (in parallel) to see uncommitted changes, staged changes, and available branches.
   - Take the active branch's contents as given. Don't evaluate whether the branch's diff "should" contain more than it does, compare it against what some other task or conversation implied should be there, or ask the user to confirm the code is complete — the PR is for whatever is actually committed (plus whatever gets committed in step 4), full stop.
   - Also check whether a PR already exists for this branch: `gh pr list --head <source> --state open --json number,url,baseRefName`. Note any number/URL/base that comes back — it determines whether step 9 creates a new PR or updates an existing one for a given target.

3. **Determine the target branch(es), proposing only Gitflow-valid ones.**
   - This repo enforces Gitflow branch-source rules via a required `gitflow` check (`.github/workflows/gitflow.yml` is the source of truth — re-read it if these rules ever look out of date):

     | Target      | Allowed source                                      |
     | ----------- | --------------------------------------------------- |
     | `main`      | `release/*`, `hotfix/*`                             |
     | `staging`   | `feature/*`, `release/*`, `hotfix/*`, `main-sync/*` |
     | `release/*` | `staging`, `hotfix/*`                               |

     Any _other_ target (e.g. another `feature/*` branch) has no source restriction at all — the check only gates `main`/`staging`/`release/*` targets.

   - **If the source branch is `hotfix/*`, skip the question entirely.** Targets are always both `main` and `staging` together — a hotfix needs to land in production and the mainline development branch alike, so this always produces two PRs from here on (steps 5-9 each run once per target). Tell the user this is happening rather than asking; there's no single-target hotfix case.
   - Otherwise, classify the source branch (from step 2) by prefix and compute its valid targets:
     - `feature/*` → `staging`, plus any other existing `feature/*` branch from step 2's `git branch -a` (excluding itself) — feature-into-feature stacking is unrestricted by the check.
     - `release/*` → `main` and `staging`.
     - `main-sync/*` → `staging` only — same single-target shape as `staging` itself below, since a sync branch's only job is to land back on `staging`.
     - `staging` itself → any existing `release/*` branch (there's no other valid target).
     - anything else (e.g. a personal `name/description` branch, or `main`) → no valid target among `main`/`staging`/`release/*`.
   - When a bucket needs concrete `release/*` or `feature/*` branches (not just the pattern), pull the actual names from step 2's `git branch -a` output.
   - Always use AskUserQuestion for the non-hotfix case — never silently assume a target, even when only one is valid. The tool requires at least 2 manually-specified options (its automatic "Other" doesn't count toward that minimum):
     - If there are valid targets, list them (first/most obvious one recommended) alongside a generic "A different branch" fallback option so the call always has ≥2 real choices.
     - If there are zero valid targets, don't quietly fall back to `main`: tell the user this branch's name doesn't match any Gitflow source pattern, so it will fail the required `gitflow` check against `main`/`staging`/`release/*` regardless of target. Then ask (still via AskUserQuestion) whether to (a) proceed anyway toward a manually-typed target, accepting the check will fail, or (b) stop so they can rename the branch, or start over with `/create-feature`/`/create-hotfix`.
   - If the source branch (step 2) equals a chosen target branch, stop and tell the user they need to be on a different branch — do not open a PR from a branch into itself. (Not reachable for the hotfix case, since `hotfix/*` never equals `main` or `staging`.)
   - From here on, "target(s)" refers to the branch(es) determined in this step — a single branch for every case except `hotfix/*`, which is always the pair `main` + `staging`. Steps 5-9 that reference "target" singular apply once per target when there's more than one.

4. **Offer to commit uncommitted work.**
   - If `git status` shows uncommitted or unstaged changes, summarize what changed and use AskUserQuestion to ask whether to commit them before opening the PR (yes / no — describe what would be committed). Do not commit without asking, even though the PR is the user's explicit goal.
   - If they say yes, stage the relevant files (never blind `git add -A`) and commit following this repo's normal commit conventions (see the Git Safety Protocol / commit instructions already in context) — draft a concise message focused on why, use a HEREDOC, include the `Co-Authored-By` trailer.

5. **Pull the target branch into the source branch before pushing.**
   - This keeps the source branch up to date with its target and avoids the PR's diff carrying stale/conflicting history. It's a merge into the local branch — not a rebase — so no history rewriting occurs.
   - For the hotfix pair, only pull from `main` — a hotfix branches off `main`, and merging `staging` into it would drag unreleased staging-only work into the PR that lands on `main`. Non-hotfix sources have exactly one target from step 3; pull from that.
   - Run `git fetch origin <target>`, then `git merge origin/<target>`.
   - If the merge completes cleanly (including "already up to date"), continue.
   - If it conflicts, stop: run `git merge --abort` to leave the branch as it was, then tell the user which files conflicted and that they'll need to resolve the merge manually before re-running this skill. Don't attempt to resolve conflicts automatically.

6. **Push automatically if there's anything to push.**
   - Check whether the current branch has an upstream and whether local commits are ahead of it (`git status -sb` or `git rev-list @{u}..HEAD` if an upstream exists).
   - Run `git log <target>..HEAD --oneline` to confirm there are commits ahead of the target — pushing is a one-time action on the source branch itself, so for the hotfix pair a single representative check against `main` is enough (a hotfix branches off `main`, so "ahead of main" is a reliable stand-in for "has any work at all"; step 7 still evaluates each target's own diff separately). If there's nothing to push (no commits ahead even after steps 4-5), stop and tell the user there's no work to open a PR for.
   - Otherwise, push right away without asking first — run `git push` (or `git push -u origin <branch>` if no upstream is set yet) whenever step 4 or step 5 produced a new commit, or whenever the branch already has commits that aren't on `origin`. Never push to `main` directly — this pushes the source branch, not the target.

7. **Gather context for the summary, once per target.**
   - For each target, run `git diff <target>...HEAD` and `git log <target>..HEAD` (note the triple-dot vs double-dot: diff against the merge base, log of all commits on the branch) to see the full set of changes that PR will contain, not just the latest commit. For the hotfix pair, run this once against `main` and once against `staging` — the two diffs will usually differ (e.g. staging may already contain commits main doesn't), and each PR's summary should reflect its own comparison, not be copy-pasted from the other.
   - This is for writing the summary only — it's not a cue to go looking for gaps. If a diff looks smaller, larger, or different than expected, that's not this skill's concern; describe what's actually there and move on. Do not pause to ask the user whether it looks right.
   - If any target's diff against `HEAD` comes back empty (source is already fully contained in that target), skip creating a PR for that target and say why, rather than opening an empty one — still proceed with whichever target(s) do have a diff.

8. **Draft the PR, once per target.**
   - Title: short, under ~70 characters, imperative mood. Reuse the same title across both hotfix PRs unless the diffs genuinely warrant different framing.
   - Body: a `## Summary` section (1-4 bullet points on _what_ changed and _why_, based on that target's own step-7 diff/log — not a restatement of commit messages) and a `## Test plan` section (checklist of how this was/should be verified — reference this repo's actual checks where relevant: `npm run pre-commit`, `npm test`, `npm run test:e2e`, etc., per what was actually touched).
   - Pass the body via a HEREDOC to `gh pr create` for correct formatting, same as this repo's standard PR-creation convention.

9. **Create or update the PR, once per target.**
   - If step 2 found an existing open PR for this branch with a matching `baseRefName`, update it instead of opening a duplicate: `gh pr edit <number> --title "..." --body "$(cat <<'EOF' ... EOF)"`. No need to ask first — updating an already-open PR with the branch's current state is the expected outcome of running this skill again.
   - Otherwise, run `gh pr create --base <target> --title "..." --body "$(cat <<'EOF' ... EOF)"`.
   - For the hotfix pair, do this independently for `main` and for `staging` — an existing PR into one doesn't affect the other, and skipping one target (per step 7) doesn't block creating/updating the other.
   - Report the PR URL(s) back to the user either way — both, for the hotfix case.

## Notes

- This project's `.claude/settings.json` has `git push origin *` and `gh pr create/view/comment/list` under `permissions.ask` — expect (and don't try to suppress) a confirmation prompt on those calls; that's intentional, not a bug.
- Never force-push, never push to `main`, and never skip the pre-commit hook (`--no-verify`) to make a commit succeed.
- Target selection is Gitflow-aware (see step 3) — don't default to `main` out of habit, and don't ask for `hotfix/*` branches, which always get both `main` and `staging`. `.github/workflows/gitflow.yml` is the source of truth if the rules table in step 3 ever drifts from the real check.
- `main-sync/*` branches are normally created and PR'd directly by `/create-main-sync`, which doesn't defer to this skill (same reasoning `/create-release` uses for its own release branch). This skill's `main-sync/*` handling exists so re-running `/create-pr` from an already-created sync branch still proposes the right (only) target.
- If the user only asked for a summary of work done (not a PR), skip `gh pr create` and just present the step 7 summary directly instead (both diffs, for a hotfix branch).
- Don't second-guess the branch's contents against prior conversation context, other branches, or what you think "should" be there. If something you worked on earlier isn't on the active branch, that's out of scope for this skill — PR what's there, and let the user raise it if it's actually a problem.
