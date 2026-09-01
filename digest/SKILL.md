---
name: digest
description: Solve the ingest problem. Distill the last turn into an HRP v1 JSON envelope and render it via the data-driven HTML template (harness-report.html). Caps at ~10 bullets across files/decisions/errors/commands. Auto-opens in browser.
allowed-tools:
  - Read
  - Bash(git:*)
  - Bash(diff:*)
  - Bash(stat:*)
  - Bash(xdg-open:*)
  - Bash(open:*)
  - Bash(start:*)
  - Bash(cmd:*)
  - Bash(mkdir:*)
  - Write
  - Glob
  - Grep
when_to_use: |
  Use when the user wants to ingest a long turn quickly — replaces re-reading verbose terminal/.md output with a scannable HTML digest. Trigger phrases: "digest", "summarize this", "what just happened", "harness report".
argument-hint: ""
arguments: []
context: inline
---

# digest · HRP v1

## Goal
Solve the **ingest problem**. LLM turn output is verbose in the terminal or in a `.md` file — too much text, hard to scan, lots of errors creep in. **`/digest` compresses that noise into a scannable HTML page** at `./.harness-reports/harness-report-<ts>.html` (with the raw JSON archived alongside).

You emit a fixed JSON envelope (`HRP` — Harness Report Protocol v1). **At most ~10 crucial bullets** across four sections: Files, Decisions, Errors, Commands.

You emit **only valid JSON**. You do **not** write HTML, CSS, or any markup. The renderer hydrates a fixed template from your JSON.

> Note on naming: this skill is `/digest` (the action — what the user does). The output file is `harness-report.html` (the artifact — what gets produced). The internal protocol is HRP. Different names for different roles — easier to scan, less collision.

---

## Steps

### 1. Gather the source material
Scan the recent transcript of this turn — tool calls, file edits, bash output, assistant prose. Prefer tool-call results over prose — they are the ground truth of what the harness *did*.

If `$text` was passed as an argument, use it directly.

### 2. Decide file status from git (live evidence)
Run `git status --porcelain` and `git diff --stat`. **Trust git over memory** — only list files that show up in git output.

### 3. Extract & rank — strict cap of ~10 bullets total
Distribute across the four sections. If a section has nothing, use an **empty array `[]`** (do not omit the key). Errors section is **highest priority** — never truncate it.

### 4. Emit the HRP JSON envelope
Output a single ```json fenced block matching the schema in `./hrp.schema.json`. **No prose before or after the block.** Renderer will read it as-is.

### 5. Write two files + open
- Create `./.harness-reports/` if missing.
- Write `harness-report-<ts>.html` — wrap your JSON in `<script type="application/json" id="hrp-data">…</script>` inside the existing template (the template's other 5 files: `harness-report.html`, `renderer.js`, `hrp.schema.json`, `example-report.json`, `SKILL.md`).
- Write `harness-report-<ts>.json` — your raw JSON, pretty-printed.
- Append `.harness-reports/` to `.gitignore` if a `.gitignore` exists in the project root.
- Auto-open the `.html` in the default browser (`xdg-open` / `open` / `cmd /c start ""`).

---

## HRP v1 — schema (you emit this)

The renderer expects a versioned envelope. Required fields are mandatory; optional fields may be omitted.

```json
{
  "hrp": "1.0",
  "report": {
    "title": "string (required)",
    "subtitle": "string (optional)",
    "timestamp": "ISO 8601 string (required)",
    "project": "string (required)",
    "branch": "string | null",
    "model": "string (optional)",
    "wall_time_seconds": 0,
    "tokens": { "in": 0, "out": 0, "total": 0 },
    "cost_usd": 0.04,
    "status": "success | partial | failed | noop",
    "sections": {
      "overview": {
        "summary": "string (required)",
        "stats": [{ "label": "string", "value": "string" }]
      },
      "files":     [FileItem],
      "decisions": [DecisionItem],
      "errors":    [ErrorItem],
      "commands":  [CommandItem]
    }
  }
}
```

### Item shapes

```ts
type FileItem = {
  path: string,                  // required
  action: "created" | "modified" | "deleted" | "renamed",  // required
  summary?: string,              // optional, ≤300 chars
  lines_added?: number,
  lines_removed?: number,
};

type DecisionItem = {
  title: string,                 // required, ≤80 chars
  detail: string,                // required, ≤600 chars (2 lines)
  tradeoffs?: string[],          // optional, prefix "+" or "−" for color coding
  reversible?: boolean,
};

type ErrorItem = {
  title: string,                 // required
  detail?: string,
  severity: "error" | "warn" | "info",  // required enum
  source?: "command" | "file" | "tool" | "other",
  output_excerpt?: string,       // ONLY raw output / stack trace, no prose
};

type CommandItem = {
  command: string,               // required
  exit_code: number,             // required (0 = ok)
  duration_ms?: number,
  note?: string,
  output_excerpt?: string,       // ONLY raw output, no prose
};
```

### Empty / no-op turn

Every section is an array — use `[]` if empty. The renderer shows `.empty-state` automatically. **Do not omit sections.**

---

## Example (full turn)

```json
{
  "hrp": "1.0",
  "report": {
    "title": "al-Idrisi — Docs Diátaxis Migration",
    "subtitle": "Collapsed three Markdown directories into a single docs/ tree.",
    "timestamp": "2026-09-02T00:00:00Z",
    "project": "idrisi-platform",
    "branch": "main",
    "model": "Opus 4.8",
    "wall_time_seconds": 142,
    "tokens": { "in": 9100, "out": 3300, "total": 12400 },
    "cost_usd": 0.04,
    "status": "success",
    "sections": {
      "overview": {
        "summary": "Collapsed design/, docs/, specs/ into a single docs/ tree organized by Diátaxis purpose.",
        "stats": [
          { "label": ".md files",   "value": "13" },
          { "label": "in docs/",     "value": "12" },
          { "label": "README lines", "value": "124" }
        ]
      },
      "files": [
        { "path": "README.md",        "action": "modified", "summary": "Root README rewritten — 12 internal links repointed.", "lines_added": 84, "lines_removed": 73 },
        { "path": "docs/README.md",   "action": "created",  "summary": "New Diátaxis index." },
        { "path": "design/",          "action": "deleted",  "summary": "Merged into docs/explanation/." }
      ],
      "decisions": [
        {
          "title": "Adopt Diátaxis structure",
          "detail": "Organized docs by purpose: explanation/, how-to/, reference/, tutorials/.",
          "tradeoffs": ["+ clearer mental model", "− requires every internal link to be rewritten"],
          "reversible": false
        }
      ],
      "errors": [],
      "commands": [
        { "command": "git mv design/* docs/explanation/", "exit_code": 0, "duration_ms": 320, "note": "bulk-rename" },
        { "command": "python scripts/verify_links.py",   "exit_code": 0, "duration_ms": 1800, "note": "all links resolve" }
      ]
    }
  }
}
```

A complete reference example is at `./example-report.json`.

---

## Rules (strict)

1. **Output ONLY the JSON envelope.** Wrap in a single ```json fenced block. No prose before or after.
2. **`hrp: "1.0"` envelope is required.** Any other version → renderer warns.
3. **≤10 items total** across `files + decisions + errors + commands`. If you have 12 candidates, drop the 2 least actionable. The validator enforces this; exceeding it shows a banner.
4. **Empty sections = `[]`** (do not omit the key). The renderer needs them present so cards always render. "No errors" is information.
5. **`output_excerpt` is for raw output ONLY** — terminal stdout/stderr, stack traces, log lines. Never put narrative prose there. (This was the cause of the original "words stacked vertically" bug.)
6. **One bullet per file/decision/command.** Don't pack multiple items into one.
7. **Never include secrets, tokens, `.env` contents.** Renderer escapes HTML but does not redact secrets.
8. **File paths are repo-relative.** No leading `./` unless that's how they appear in `git status`.
9. **`status` enum is strict** — pick `success | partial | failed | noop`. If unsure, use `partial`.
10. **`output_excerpt` ≤ 6 lines, ≤ 1000 chars.** Renderer truncates anyway.
11. **`title` ≤ 80 chars, `detail` ≤ 600 chars.** Renderer truncates with `…`.
12. **You do not write HTML.** If the renderer breaks, fix the schema — not the template.

---

## Validator behavior

The renderer runs a hand-rolled validator (no ajv dep). On issues:

- **Missing required field** → validation banner with the missing key; section still renders with empty-state.
- **Invalid enum** → the value is still rendered but a warning appears.
- **>10 bullets total** → banner + visible truncation note.
- **Malformed JSON** → fatal error page (does not crash, but shows the parse error).

The renderer NEVER crashes. Worst case is a degraded render with a clear error banner.

---

## Files

| Path | Role |
|---|---|
| `./SKILL.md` | This file. Skill instructions for the LLM. |
| `./hrp.schema.json` | JSON Schema 2020-12 reference. Documentation; runtime validator is hand-rolled. |
| `./example-report.json` | Standalone reference payload (Docs Diátaxis Migration). |
| `./harness-report.html` | Data-driven HTML template. Hydrated by renderer.js from inline JSON. Single theme (lavender) for now. |
| `./renderer.js` | Vanilla-JS hydration script. ~400 lines. Zero deps. |

## Hook stub (optional, for true auto-fire)

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "puku-cli skill run digest" }
        ]
      }
    ]
  }
}
```

Until the hook is wired, invoke manually with `/digest`.
