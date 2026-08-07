---
name: create-pr
description: Use when the user asks to open a PR, create a pull request, or wrap up the current branch for review (e.g. "create a PR", "open a PR for this", "let's get this reviewed"). Commits (after asking) and automatically pushes the current branch's work, then opens a PR with a generated summary of the work done — asks which branch to target, defaulting to main.
---

# create-pr

Turn the current branch's work into a pull request against `main`, asking before any commit. Pushing happens automatically once there's something to push.

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
   - Also check whether a PR already exists for this branch: `gh pr list --head <source> --state open --json number,url`. Note the number/URL if one comes back — it determines whether step 8 creates a new PR or updates this one.

3. **Ask which branch to merge into.**
   - Always use AskUserQuestion for this — never assume `main` without asking, even when it's the only sensible candidate. The tool requires at least 2 manually-specified options (its automatic "Other" doesn't count toward that minimum), so the question always needs a real second option:
     - If `git branch -a` surfaced other clearly-relevant long-lived branches (e.g. `develop`, `release/*`), list `main` first/recommended plus those as additional options.
     - Otherwise, still ask, pairing `main` with a generic second option (e.g. "A different branch" — description: "Type the branch name to target instead of main") so the call has 2 real choices; the user can also always type a custom branch via "Other".
   - If the source branch (step 2) equals the chosen target branch, stop and tell the user they need to be on a different branch — do not open a PR from a branch into itself.
   - From here on, "target" refers to the branch chosen in this step (default `main`) — use it in place of every `main` reference below.

4. **Offer to commit uncommitted work.**
   - If `git status` shows uncommitted or unstaged changes, summarize what changed and use AskUserQuestion to ask whether to commit them before opening the PR (yes / no — describe what would be committed). Do not commit without asking, even though the PR is the user's explicit goal.
   - If they say yes, stage the relevant files (never blind `git add -A`) and commit following this repo's normal commit conventions (see the Git Safety Protocol / commit instructions already in context) — draft a concise message focused on why, use a HEREDOC, include the `Co-Authored-By` trailer.

5. **Push automatically if there's anything to push.**
   - Check whether the current branch has an upstream and whether local commits are ahead of it (`git status -sb` or `git rev-list @{u}..HEAD` if an upstream exists).
   - Run `git log <target>..HEAD --oneline` to confirm there are commits ahead of the target. If there's nothing to push (no commits ahead of the target even after step 4), stop and tell the user there's no work to open a PR for.
   - Otherwise, push right away without asking first — run `git push` (or `git push -u origin <branch>` if no upstream is set yet) whenever step 4 produced a new commit, or whenever the branch already has commits that aren't on `origin`. Never push to `main` directly — this pushes the source branch, not the target.

6. **Gather context for the summary.**
   - Run `git diff <target>...HEAD` and `git log <target>..HEAD` (note the triple-dot vs double-dot: diff against the merge base, log of all commits on the branch) to see the full set of changes that will be in the PR, not just the latest commit.
   - This is for writing the summary only — it's not a cue to go looking for gaps. If the diff looks smaller, larger, or different than expected, that's not this skill's concern; describe what's actually there and move on. Do not pause to ask the user whether it looks right.

7. **Draft the PR.**
   - Title: short, under ~70 characters, imperative mood.
   - Body: a `## Summary` section (1-4 bullet points on _what_ changed and _why_, based on step 6's diff/log — not a restatement of commit messages) and a `## Test plan` section (checklist of how this was/should be verified — reference this repo's actual checks where relevant: `npm run pre-commit`, `npm test`, `npm run test:e2e`, etc., per what was actually touched).
   - Pass the body via a HEREDOC to `gh pr create` for correct formatting, same as this repo's standard PR-creation convention.

8. **Create or update the PR.**
   - If step 2 found an existing open PR for this branch, update it instead of opening a duplicate: `gh pr edit <number> --title "..." --body "$(cat <<'EOF' ... EOF)"`. No need to ask first — updating an already-open PR with the branch's current state is the expected outcome of running this skill again.
   - Otherwise, run `gh pr create --base <target> --title "..." --body "$(cat <<'EOF' ... EOF)"`.
   - Report the PR URL back to the user either way.

## Notes

- This project's `.claude/settings.json` has `git push origin *` and `gh pr create/view/comment/list` under `permissions.ask` — expect (and don't try to suppress) a confirmation prompt on those calls; that's intentional, not a bug.
- Never force-push, never push to `main`, and never skip the pre-commit hook (`--no-verify`) to make a commit succeed.
- If the user only asked for a summary of work done (not a PR), skip `gh pr create` and just present the Step 6 summary directly instead.
- Don't second-guess the branch's contents against prior conversation context, other branches, or what you think "should" be there. If something you worked on earlier isn't on the active branch, that's out of scope for this skill — PR what's there, and let the user raise it if it's actually a problem.
