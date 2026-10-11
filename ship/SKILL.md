---
name: ship
description: One command for the full ship workflow. Commit this session's changes only (not other sessions') and open a PR (pr-ship), then review, verify all merge gates, and merge it (pr-merge). Merges without asking when everything is green; stops only for blocking findings, risky files, or failed gates.
argument-hint: "[--draft] [--base <branch>] [--squash|--merge|--rebase] [--no-merge] [intent]"
disable-model-invocation: true
---

# /ship

Run the full workflow end to end: commit, open the PR, review it, and merge it. Arguments: `$ARGUMENTS`

This skill orchestrates two sibling skills. Read each one in full and follow it exactly. Their rules
apply here unchanged.
- Phase 1: `../pr-ship/SKILL.md` (relative to this skill's directory, normally `~/.claude/skills/pr-ship/SKILL.md`)
- Phase 2: `../pr-merge/SKILL.md` (normally `~/.claude/skills/pr-merge/SKILL.md`)

If either file is missing, stop and tell the user to install both `pr-ship` and `pr-merge`.

**Scope: this session only.** `/ship` commits and merges only the changes this session made. Other sessions
working in the same checkout keep their uncommitted changes, and nothing of theirs ends up in the PR. `pr-ship`
builds the commit in a separate worktree from this session's files, and `pr-merge` cleans up without touching
anyone else's work. If you can't tell whether a change is this session's, ask.

## Flow
1. **Phase 1: ship.** Run every step of `pr-ship`. Pass along `--draft`, `--base`, and the intent text. Record the PR number and URL.
   - If Phase 1 stops (secret found, checks fail, conflict), stop here and report. Don't start Phase 2.
   - If `--draft` or `--no-merge` was passed, stop after Phase 1 and report the PR.
2. **Phase 2: review and merge.** Run every step of `pr-merge` on that PR. Pass `--yes`, plus the strategy flag if one was given.
   - Wait for CI with `gh pr checks <pr> --watch --fail-fast`. If it runs long, keep the user posted rather than going silent.
   - Run it with `--yes`: the user typing `/ship` is the go-ahead to merge, so don't ask when the review has no
     BLOCKING findings, nothing needs human sign-off, and every gate passes. Print a one-line merge summary instead.
     If any of those fails, stop and ask, exactly as `pr-merge` would standalone.
   - If a gate fails, stop and report the fix. The PR stays open, so `/pr-merge <pr>` can resume later.
3. **Report.** Give the PR URL, commits, review findings, gate results, merge SHA (or why it stopped), and post-merge CI status.

**Escalate, don't guess.** At any point, ask one concise question or give a recommendation when human judgment is needed.
