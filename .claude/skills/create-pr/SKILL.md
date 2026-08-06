---
name: create-pr
description: Use when the user asks to open a PR, create a pull request, or wrap up the current branch for review (e.g. "create a PR", "open a PR for this", "let's get this reviewed"). Commits and pushes the current branch's work (after asking), then opens a PR with a generated summary of the work done — asks which branch to target, defaulting to main.
---

# create-pr

Turn the current branch's work into a pull request against `main`, asking before any commit or push.

## Steps

1. **Check preconditions.**
   - Run `git branch --show-current`. Note it as the source branch.
   - Run `git status`, `git diff`, and `git branch -a` (in parallel) to see uncommitted changes, staged changes, and available branches.

2. **Ask which branch to merge into.**
   - Always use AskUserQuestion for this — never assume `main` without asking, even when it's the only sensible candidate. The tool requires at least 2 manually-specified options (its automatic "Other" doesn't count toward that minimum), so the question always needs a real second option:
     - If `git branch -a` surfaced other clearly-relevant long-lived branches (e.g. `develop`, `release/*`), list `main` first/recommended plus those as additional options.
     - Otherwise, still ask, pairing `main` with a generic second option (e.g. "A different branch" — description: "Type the branch name to target instead of main") so the call has 2 real choices; the user can also always type a custom branch via "Other".
   - If the source branch (step 1) equals the chosen target branch, stop and tell the user they need to be on a different branch — do not open a PR from a branch into itself.
   - From here on, "target" refers to the branch chosen in this step (default `main`) — use it in place of every `main` reference below.

3. **Offer to commit uncommitted work.**
   - If `git status` shows uncommitted or unstaged changes, summarize what changed and use AskUserQuestion to ask whether to commit them before opening the PR (yes / no — describe what would be committed). Do not commit without asking, even though the PR is the user's explicit goal.
   - If they say yes, stage the relevant files (never blind `git add -A`) and commit following this repo's normal commit conventions (see the Git Safety Protocol / commit instructions already in context) — draft a concise message focused on why, use a HEREDOC, include the `Co-Authored-By` trailer.

4. **Offer to push.**
   - Check whether the current branch has an upstream and whether local commits are ahead of it (`git status -sb` or `git rev-list @{u}..HEAD` if an upstream exists).
   - Run `git log <target>..HEAD --oneline` to confirm there are commits ahead of the target. If there's nothing to push (no commits ahead of the target even after step 3), stop and tell the user there's no work to open a PR for.
   - Otherwise use AskUserQuestion to confirm pushing to `origin` before running `git push` (or `git push -u origin <branch>` if no upstream is set yet). Never push to `main` directly — this pushes the source branch, not the target.

5. **Gather context for the summary.**
   - Run `git diff <target>...HEAD` and `git log <target>..HEAD` (note the triple-dot vs double-dot: diff against the merge base, log of all commits on the branch) to see the full set of changes that will be in the PR, not just the latest commit.

6. **Draft the PR.**
   - Title: short, under ~70 characters, imperative mood.
   - Body: a `## Summary` section (1-4 bullet points on _what_ changed and _why_, based on step 5's diff/log — not a restatement of commit messages) and a `## Test plan` section (checklist of how this was/should be verified — reference this repo's actual checks where relevant: `npm run pre-commit`, `npm test`, `npm run test:e2e`, etc., per what was actually touched).
   - Pass the body via a HEREDOC to `gh pr create` for correct formatting, same as this repo's standard PR-creation convention.

7. **Create the PR.**
   - Run `gh pr create --base <target> --title "..." --body "$(cat <<'EOF' ... EOF)"`.
   - Report the returned PR URL back to the user.

## Notes

- This project's `.claude/settings.json` has `git push origin *` and `gh pr create/view/comment/list` under `permissions.ask` — expect (and don't try to suppress) a confirmation prompt on those calls; that's intentional, not a bug.
- Never force-push, never push to `main`, and never skip the pre-commit hook (`--no-verify`) to make a commit succeed.
- If the user only asked for a summary of work done (not a PR), skip `gh pr create` and just present the Step 5 summary directly instead.
