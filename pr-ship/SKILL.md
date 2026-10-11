---
name: pr-ship
description: Step 1 of 2. Commit current changes on a feature branch (secret scan, local checks, Conventional Commits), push, and open a GitHub PR. Follow with /pr-merge <number>.
argument-hint: "[--draft] [--base <branch>] [--reviewer <user>] [--label <label>] [intent]"
disable-model-invocation: true
---

# /pr-ship

Commit, push, and open a PR for the current changes. Arguments: `$ARGUMENTS`

`SCRIPTS` = this skill's `scripts/` directory (normally `~/.claude/skills/pr-ship/scripts`).

## Rules
- Never commit to the default branch or a protected branch.
- Never use `--no-verify`, `--no-gpg-sign`, `--force`, or a blind `git add -A`/`.`. Stage by explicit path.
- Never commit secrets, `.env*`, keys, or build artifacts. The only allowed force push is `--force-with-lease` on your own branch.
- **GitHub only through gh.** Every remote operation goes through `gh` or `bash SCRIPTS/gh-git.sh`
  (HTTPS with gh's credentials). Never run `git push`, `git pull`, or `git fetch` against `origin`
  directly: an SSH remote can hang (this happened: port 22 failures while gh worked). Local-only git
  (`status`, `diff`, `add`, `commit`, `switch`, `branch`, `rebase`) is fine.
- Run each step's commands with `bash`, one step per tool call, so one failing probe (e.g. `which`)
  doesn't hide the rest of the output.
- **Escalate, don't guess.** When intent is unclear, a decision is risky, or human judgment is needed, ask one concise question or give a recommendation with the trade-off.

## Steps
1. **Preflight.** One call: `gh auth status`, `gh repo view --json nameWithOwner,defaultBranchRef,squashMergeAllowed`,
   `git status --short --branch`, and a check for `.git/rebase-merge`, `.git/rebase-apply`, `.git/MERGE_HEAD`.
   Stop if gh isn't authenticated, a rebase/merge is in progress, or there's nothing to ship.
   BASE = `--base`, or the repo's default branch.
2. **Inspect.** Read the status, the staged and unstaged diffs, and any untracked files. Exclude junk and sensitive files and suggest `.gitignore` entries for them. If the changes cover unrelated concerns, plan one commit per concern.
3. **Branch.** Name: `<type>/<kebab-slug>`. Types: feat, fix, refactor, perf, docs, test, chore, ci, build.
   - On BASE or a protected branch: `git switch -c <name>`.
   - On another branch that doesn't follow the pattern and has no PR yet (`gh pr list --head <branch>` is empty): `git branch -m <name>`.
   - On a branch that already has a PR: keep it.
4. **Stage and scan (blocking).** `git add <explicit paths>`, then `bash SCRIPTS/secret-scan.sh`. It uses gitleaks when
   installed and a pattern scan either way, so a missing gitleaks is not an error. On exit 1, unstage the hit, report
   file and line (never the value), and stop. Say that any leaked secret must be rotated.
5. **Local checks.** Run the project's lint, type-check, and unit-test commands, matching CI where possible (read
   `.github/workflows/*`, package.json, Makefile, pyproject, Cargo, go, CLAUDE.md, or CONTRIBUTING). Use a 10-minute tool
   timeout. If a failure is small and obvious, fix it and re-stage. Otherwise stop and report. Record the results for the PR body.
6. **Commit.** Use Conventional Commits, passed with a heredoc: `type(scope): imperative summary` (72 characters or fewer), then a body explaining *why*, `BREAKING CHANGE:` and `Refs: #n` when they apply, and the `Co-Authored-By` trailer. Let the hooks run. If a hook changes files, re-stage them and make a new commit. Never amend a commit that was already pushed.
7. **Sync and push.** `bash SCRIPTS/gh-git.sh fetch BASE`. If the branch is yours alone, `git rebase origin/<BASE>`;
   if others share it, `git merge origin/<BASE>`. If a conflict isn't trivial, `git rebase --abort` and ask.
   Then `bash SCRIPTS/gh-git.sh push` (`push --force-with-lease` after rebasing a branch that was already pushed).
8. **Open the PR.** If `gh pr list --head <branch>` finds one, update it with `gh pr edit` and don't create a duplicate.
   Use the repo's PR template if it has one (`.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE/`;
   check with `ls`, not a glob, since zsh errors on an unmatched glob). Otherwise use these sections: **Summary**,
   **Changes**, **Testing**, **Risk & rollback**, **Closes #n**, and the Claude Code footer. Create it with
   `gh pr create --base <BASE> --head <branch> --title "<conventional title>" --body-file -` plus any flags passed
   (`--head` keeps gh from trying to push).
9. **Report.** Give the branch, commits (SHA + subject), PR number and URL, check results, and anything excluded or needing a human decision. Next step: `/pr-merge <number>`.
