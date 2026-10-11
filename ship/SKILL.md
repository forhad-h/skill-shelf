---
name: ship
description: One command for the full ship workflow. Commit current changes and open a PR (pr-ship), then review, verify all merge gates, and merge it (pr-merge). Stops once for explicit merge confirmation.
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

## Flow
1. **Phase 1: ship.** Run every step of `pr-ship`. Pass along `--draft`, `--base`, and the intent text. Record the PR number and URL.
   - If Phase 1 stops (secret found, checks fail, conflict), stop here and report. Don't start Phase 2.
   - If `--draft` or `--no-merge` was passed, stop after Phase 1 and report the PR.
2. **Phase 2: review and merge.** Run every step of `pr-merge` on that PR. Pass the strategy flag if one was given.
   - Wait for CI with `gh pr checks <pr> --watch --fail-fast`. If it runs long, keep the user posted rather than going silent.
   - Keep the confirmation step: show the merge card and wait for an explicit "yes". Never skip it, even though the user started the whole flow with one command.
   - If a gate fails, stop and report the fix. The PR stays open, so `/pr-merge <pr>` can resume later.
3. **Report.** Give the PR URL, commits, review findings, gate results, merge SHA (or why it stopped), and post-merge CI status.

**Escalate, don't guess.** At any point, ask one concise question or give a recommendation when human judgment is needed.
