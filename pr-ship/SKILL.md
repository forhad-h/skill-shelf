---
name: pr-ship
description: Step 1 of 2. Commit only this session's changes (isolated worktree, so other sessions' edits stay out) on a feature branch (secret scan, local checks, Conventional Commits), push, and open a GitHub PR. Follow with /pr-merge <number>.
argument-hint: "[--draft] [--base <branch>] [--reviewer <user>] [--label <label>] [intent]"
disable-model-invocation: true
---

# /pr-ship

Commit, push, and open a PR for the current changes. Arguments: `$ARGUMENTS`

`SCRIPTS` = this skill's `scripts/` directory (normally `~/.claude/skills/pr-ship/scripts`).

## Rules
- Never commit to the default branch or a protected branch.
- **This session's changes only.** Other Claude sessions may be editing the same checkout at the same
  time. Ship only files this session changed, and never stage, commit, `switch`, `stash`, `rebase`,
  `reset`, or `restore` in the main checkout. All of that happens in a separate worktree built by
  `bash SCRIPTS/session-worktree.sh` (`WT` below). Other sessions' changes stay where they are, uncommitted.
- Never use `--no-verify`, `--no-gpg-sign`, `--force`, or a blind `git add -A`/`.`. Stage by explicit path.
- Never commit secrets, `.env*`, keys, or build artifacts. The only allowed force push is `--force-with-lease` on your own branch.
- **GitHub only through gh.** Every remote operation goes through `gh` or `bash SCRIPTS/gh-git.sh`
  (HTTPS with gh's credentials). Never run `git push`, `git pull`, or `git fetch` against `origin`
  directly: an SSH remote can hang (this happened: port 22 failures while gh worked). Local-only git
  (`add`, `commit`, `rebase`) is fine inside WT; in the main checkout, only read (`status`, `diff`, `log`).
- Run each step's commands with `bash`, one step per tool call, so one failing probe (e.g. `which`)
  doesn't hide the rest of the output.
- **Escalate, don't guess.** When intent is unclear, a decision is risky, or human judgment is needed, ask one concise question or give a recommendation with the trade-off.

## Steps
1. **Preflight.** One call: `gh auth status`, `gh repo view --json nameWithOwner,defaultBranchRef,squashMergeAllowed`,
   `git status --short --branch`, and a check for `.git/rebase-merge`, `.git/rebase-apply`, `.git/MERGE_HEAD`.
   Stop if gh isn't authenticated or a rebase/merge is in progress.
   BASE = `--base`, or the repo's default branch.
2. **Session files.** List SESSION_FILES: every path (relative to the repo root) that *this session* created, modified,
   deleted, or renamed (both old and new path). Build it from your own history in this conversation: Edit/Write/NotebookEdit
   calls, plus Bash commands that wrote files (redirects, `sed -i`, `mv`, `rm`, formatters, codegen) and files a hook or
   formatter changed as a result. Keep only paths that `git status` shows as changed.
   - Everything else `git status` shows belongs to another session or the user: leave it alone and list it under
     "not shipped" in the report.
   - If the list is empty, there's nothing to ship: stop. If the history was compacted or you're not sure a file is
     yours, ask instead of guessing.
3. **Inspect.** Read `git diff HEAD -- <SESSION_FILES>` and the new files. Every hunk must be one you made. If a file
   also has changes you didn't make (another session edited it too), stop and ask: ship the whole file, leave it out,
   or let the user split it. Exclude junk and sensitive files and suggest `.gitignore` entries for them. If the changes
   cover unrelated concerns, plan one commit per concern.
4. **Branch and worktree.** Name: `<type>/<kebab-slug>`. Types: feat, fix, refactor, perf, docs, test, chore, ci, build.
   - New PR: `bash SCRIPTS/session-worktree.sh create <BASE> <name> <WT> <SESSION_FILES...>`, with WT =
     `<scratchpad>/ship-<slug>` (or `$TMPDIR/ship-<slug>`). It branches from a fresh `origin/<BASE>` and stages only
     those files there. Exit 1 means the changes don't apply to the latest BASE: report and ask.
   - This session already opened a PR for this work and made more changes: `bash SCRIPTS/session-worktree.sh sync <branch> <files...>`.
   From here on, run every git command in WT (`git -C <WT>` or `cd <WT>`), never in the main checkout.
5. **Scan (blocking).** In WT, `bash SCRIPTS/secret-scan.sh`. It uses gitleaks when installed and a pattern scan
   either way, so a missing gitleaks is not an error. On exit 1, unstage the hit in WT, report file and line (never the
   value), and stop. Say that any leaked secret must be rotated.
6. **Local checks.** In WT, run the project's lint, type-check, and unit-test commands, matching CI where possible (read
   `.github/workflows/*`, package.json, Makefile, pyproject, Cargo, go, CLAUDE.md, or CONTRIBUTING). Use a 10-minute tool
   timeout. If WT lacks installed dependencies, symlink the ignored dependency dir from the main checkout (e.g.
   `node_modules`, `.venv`); never stage it. If a failure is small and obvious, fix it in the main checkout (it's your
   file), `sync` it into WT, and re-run. Otherwise stop and report. Record the results for the PR body.
7. **Commit.** In WT. Use Conventional Commits, passed with a heredoc: `type(scope): imperative summary` (72 characters or fewer), then a body explaining *why*, `BREAKING CHANGE:` and `Refs: #n` when they apply, and the `Co-Authored-By` trailer. Let the hooks run. If a hook changes files, re-stage them and make a new commit. Never amend a commit that was already pushed.
8. **Push.** In WT. WT already starts from the latest BASE; for a `sync` onto an older branch, run
   `bash SCRIPTS/gh-git.sh fetch BASE` and `git rebase origin/<BASE>` in WT. If a conflict isn't trivial,
   `git rebase --abort` and ask. Then `bash SCRIPTS/gh-git.sh push` from WT (`push --force-with-lease` after rebasing a
   branch that was already pushed). Keep WT until the PR is merged; `/pr-merge` removes it.
9. **Open the PR.** If `gh pr list --head <branch>` finds one, update it with `gh pr edit` and don't create a duplicate.
   Use the repo's PR template if it has one (`.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE/`;
   check with `ls`, not a glob, since zsh errors on an unmatched glob). Otherwise use these sections: **Summary**,
   **Changes**, **Testing**, **Risk & rollback**, **Closes #n**, and the Claude Code footer. Create it with
   `gh pr create --base <BASE> --head <branch> --title "<conventional title>" --body-file -` plus any flags passed
   (`--head` keeps gh from trying to push).
10. **Report.** Give the branch, WT path, commits (SHA + subject), PR number and URL, check results, the files shipped, the changed files left out as not this session's, and anything needing a human decision. Next step: `/pr-merge <number>`.
