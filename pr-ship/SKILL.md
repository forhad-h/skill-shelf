---
name: pr-ship
description: Step 1 of 2. Commit current changes on a feature branch (secret scan, local checks, Conventional Commits), push, and open a GitHub PR. Follow with /pr-merge <number>.
argument-hint: "[--draft] [--base <branch>] [--reviewer <user>] [--label <label>] [intent]"
disable-model-invocation: true
---

# /pr-ship

Commit, push, and open a PR for the current changes. Arguments: `$ARGUMENTS`

## Rules
- Never commit to the default branch or a protected branch.
- Never use `--no-verify`, `--no-gpg-sign`, `--force`, or a blind `git add -A`/`.`. Stage by explicit path.
- Never commit secrets, `.env*`, keys, or build artifacts. The only allowed force push is `--force-with-lease` on your own branch.
- **Escalate, don't guess.** When intent is unclear, a decision is risky, or human judgment is needed, ask one concise question or give a recommendation with the trade-off.

## Steps
1. **Preflight.** Check for a git repo, an authenticated `gh`, and an `origin` remote. Make sure no rebase or merge is in progress and there's something to ship. BASE = `--base`, or the repo's default branch.
2. **Inspect.** Read the status, the staged and unstaged diffs, and any untracked files. Exclude junk and sensitive files and suggest `.gitignore` entries for them. If the changes cover unrelated concerns, plan one commit per concern.
3. **Secret scan (blocking).** Run `gitleaks git --pre-commit --staged --redact` if gitleaks is available. Also grep the staged diff for token, key, and password patterns. If you find a hit, unstage it, report the file and line with the value redacted, and stop. Say that any leaked secret must be rotated.
4. **Branch.** If you're on BASE or a protected branch, run `git switch -c <type>/<kebab-slug>`. Types: feat, fix, refactor, perf, docs, test, chore, ci, build.
5. **Local checks.** Run the project's lint, type-check, and unit-test commands (from package.json, Makefile, pyproject, Cargo, go, CLAUDE.md, or CONTRIBUTING). If a failure is small and obvious, fix it. Otherwise stop and report. Record the results for the PR body.
6. **Commit.** Use Conventional Commits, passed with a heredoc: `type(scope): imperative summary` (72 characters or fewer), then a body explaining *why*, `BREAKING CHANGE:` and `Refs: #n` when they apply, and the `Co-Authored-By` trailer. Let the hooks run. If a hook changes files, re-stage them and make a new commit. Never amend a commit that was already pushed.
7. **Sync and push.** `git fetch origin`. If the branch is yours alone, rebase onto `origin/<BASE>`. If others share it, merge instead. If a conflict isn't trivial, abort and ask. Then `git push -u origin HEAD` (`--force-with-lease` after a rebase).
8. **Open the PR.** If one already exists for this branch, update it and don't create a duplicate. Use the repo's PR template if it has one. Otherwise use these sections: **Summary**, **Changes**, **Testing**, **Risk & rollback**, **Closes #n**, and the Claude Code footer. Create it with `gh pr create --base <BASE> --title "<conventional title>" --body-file -` plus any flags passed.
9. **Report.** Give the branch, commits (SHA + subject), PR URL, check results, and anything excluded or needing a human decision. Next step: `/pr-merge <number>`.
