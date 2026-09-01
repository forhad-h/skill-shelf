---
name: skill-shelf-sync
description: Sync a newly shared skill into the skill-shelf repo and push to GitHub. Detects new skills from any skills directory (~/.claude/skills, ~/.puku-cli/skills, or any /skills path), registers them in skills-config.json, runs copy-skills.sh, updates README.md, then commits and pushes. Trigger phrases: "add this skill to skill-shelf", "sync new skill", "publish skill", "push skill to shelf", "ingest new skill".
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(ls:*)
  - Bash(cat:*)
  - Bash(jq:*)
  - Bash(bash:*)
  - Bash(git:*)
  - Bash(diff:*)
  - Bash(stat:*)
  - Write
  - Edit
when_to_use: |
  Use when the user shares a new skill (or asks to check for new skills) from ~/.claude/skills, ~/.puku-cli/skills, or any /skills directory and wants it published to the skill-shelf repo. The skill enforces a strict ordering: register → copy → document → push.
argument-hint: "[skill-name] [optional:source-path]"
arguments:
  - name: skill_name
    description: "Name of the new skill (e.g. 'digest'). If omitted, scan configured roots for anything not already in skills-config.json."
    required: false
  - name: source_path
    description: "Absolute path to the source skill directory. If omitted, scan the configured skill roots."
    required: false
context: inline
---

# skill-shelf-sync

Sync a newly shared skill into the **skill-shelf** repo and push to GitHub. This is the canonical ingest pipeline:

1. **Register** — append the skill to `skills-config.json` (idempotent; never duplicate).
2. **Copy** — run `./copy-skills.sh` to aggregate files into the repo.
3. **Document** — update `README.md` (skills list + layout tree).
4. **Push** — commit and `git push` to `origin/main`.

The order is non-negotiable. Never skip steps, never reorder. If any step fails, stop and report — do not push a half-synced tree.

---

## Project root

```
/mnt/7cf8f1e2-f6ee-43b6-8f39-749a39730a18/Projects/Claude Code/skill-shelf
```

Read `skills-config.json` and `README.md` from this root. Run `git` commands here.

---

## Skills directories to scan

When the user says "check for new skills", "ingest skills", or doesn't provide a path, scan all of these for `*/SKILL.md` files:

1. `~/.puku-cli/skills/*/SKILL.md`
2. `~/.claude/skills/*/SKILL.md`
3. `~/Documents/Obsidian Vault/LinkedIn Posts/.puku-cli/skills/*/SKILL.md` (current Obsidian Vault source for the bengali-* skills)

A "new" skill is one whose directory name is **not already present** as a `.skills[].name` entry in `skills-config.json`.

---

## Step 1 — Register

Open `skills-config.json`. For each new skill, append an entry:

```json
{
  "name": "<dir-name>",
  "source": "<absolute path to source dir>"
}
```

**Rules:**
- Never duplicate: if `name` already exists, **skip** (do not overwrite the source path).
- Source path must be the directory containing `SKILL.md`, not the file.
- If source path contains spaces or special chars, the JSON string value must still be valid — escape inner `"` if any.
- Preserve file structure: 2-space indent, trailing newline, no trailing comma.

Verify after editing with `jq '.skills | length' skills-config.json`.

---

## Step 2 — Copy

Run the project script:

```bash
cd "/mnt/7cf8f1e2-f6ee-43b6-8f39-749a39730a18/Projects/Claude Code/skill-shelf" && ./copy-skills.sh
```

The script:
- Reads `skills-config.json`
- Resolves each source path
- Wipes the matching target dir, then rsyncs from source
- Prints `[i/N] <name>` lines

**Stop on warnings.** If a `[i/N] WARNING:` line prints (source not found, source == target, source inside target, etc.), abort and report. Do not push a broken state.

---

## Step 3 — Document

Open `README.md` and update:

1. Add a new `### \`<skill-name>\`` section between the last existing skill and `## Standard`. Mirror the structure of the existing entries: short prose, what it does, where files live.
2. Update the layout tree under `## Layout` to include the new skill's directory and its files.

**Rules:**
- Use the existing voice and density. Match the longest existing entry as a model (`bengali-proofreader` is the canonical example).
- For multi-file skills, list every file in the layout tree.
- Keep the file sorted by skill name when adding the section heading (alphabetic with `digest` between others).

---

## Step 4 — Push

Run, in this exact order:

```bash
cd "/mnt/7cf8f1e2-f6ee-43b6-8f39-749a39730a18/Projects/Claude Code/skill-shelf" && \
  git status && \
  git diff --stat && \
  git add skills-config.json README.md <new-skill-dir>/ && \
  git commit -m "Add <skill-name> skill

- Register <skill-name> in skills-config.json
- Document <skill-name> in README.md
- Copy skill files into the repo

Co-Authored-By: Opus 4.8 <noreply@puku.sh>" && \
  git push origin main
```

**Rules:**
- Never use `--no-verify`, `--force`, or amend without explicit user request.
- Never `git add -A` or `git add .` — add specific paths.
- If `git push` fails (network, auth, conflict), stop and report the error. Don't retry blindly.
- The push target is `origin main` — confirm `git remote -v` matches before pushing if this is the first run.

---

## Failure handling

At any step:
- **Bad config JSON** → abort, show the parse error, do not continue.
- **Source dir missing** → ask user to verify the path. Do not invent one.
- **Copy script warns** → abort, paste the warning line. Do not push.
- **README update ambiguous** (skill has no SKILL.md or description) → ask the user for a one-line description before documenting.
- **git push fails** → leave the commit un-pushed. Report the exit code + first 10 lines of error.

Never push a half-synced tree. A failed sync is recoverable; a forced wrong commit is not.

---

## Idempotency

Re-running this skill on an already-synced skill is a **no-op**: the config entry exists, the dir is already in the repo, README already documents it, no diff → empty commit is rejected by most hooks, so the run just reports "already synced" and exits.

If the user wants to **force-resync** a skill (e.g. source changed), they must say so explicitly. Then: edit the config entry only if the source path changed, then re-run from Step 2.

---

## Quick check (single skill)

If user provides a path directly, skip the scan:

```
User: "add /home/forhad-hosain/.puku-cli/skills/foo to skill-shelf"
→ name = "foo", source = "/home/forhad-hosain/.puku-cli/skills/foo"
→ run Steps 1–4
```

## Scan mode (no path)

```
User: "check ~/.claude/skills and ~/.puku-cli/skills for new skills"
→ glob both roots for */SKILL.md
→ diff dir names against skills-config.json
→ for each new name, run Steps 1–4 (in one batched commit per skill or one commit total — prefer one commit total if ≤3 skills)
```