---
name: digest
description: Solve the ingest problem. Distill the last turn (or a passed-in file/pasted prose) into an HRP v1 HTML report via the dedicated `digest-renderer` subagent. Caps at ~10 bullets. Auto-opens in browser. Parent emits one terminal line.
allowed-tools:
  - Read
  - Write
  - Bash(git:*)
  - Bash(diff:*)
  - Bash(stat:*)
  - Bash(xdg-open:*)
  - Bash(open:*)
  - Bash(start:*)
  - Bash(cmd:*)
  - Bash(mkdir:*)
  - Bash(mktemp:*)
  - Glob
  - Grep
  - Agent
when_to_use: |
  Use when the user wants to ingest a long turn quickly — replaces re-reading verbose terminal/.md output with a scannable HTML digest. Trigger phrases: "digest", "summarize this", "what just happened", "harness report".
argument-hint: ""
arguments: []
context: inline
---

# digest · HRP v1 (subagent-delegated)

## Goal

Solve the **ingest problem**. LLM turn output is verbose in the terminal or in a `.md` file — too much text, hard to scan, lots of errors creep in. **`/digest` compresses that noise into a scannable HTML page** at `$TMPDIR/harness-reports-<ts>/harness-report.html` (with the raw JSON archived alongside).

Reports are written to the **OS temp directory** so the OS auto-cleans them — no orphaned files left behind if the user forgets. The rendered HTML also gets a **"Clean from Disk"** button so the user can wipe the report files immediately after reading.

You emit a fixed JSON envelope (`HRP` — Harness Report Protocol v1). **At most ~10 crucial bullets** across four sections: Files, Decisions, Errors, Commands.

The heavy lifting — `git status` / `git diff`, HRP distillation reasoning, the two file writes (HTML + JSON), and the `xdg-open` / `open` / `cmd /c start ""` browser launch — runs **inside the dedicated `digest-renderer` subagent** (see `./agents/digest-renderer.md`). The parent emits **only** one Bash call (write the input handoff file) and **one** Agent call. The bulk of the transcript lives in the subagent's bubble and does not pollute the parent's history.

> Note on naming: this skill is `/digest` (the action — what the user does). The output file is `harness-report.html` (the artifact — what gets produced). The internal protocol is HRP. The internal subagent is `digest-renderer`. Different names for different roles — easier to scan, less collision.

---

## Steps

### 1. Gather source material

Resolve the input sources in this priority order — record every active source in the `sources[]` array of the envelope (see schema below):

1. **Positional argument after `/digest` is a file path.** If the user passed a path-looking argument AND `Read` succeeds on it, treat it as a **file source**. Record `{ kind: "file", ref: "<absolute path>", bytes: <stat size> }`. Tilde (`~/...`) is expanded by `Read`.
2. **Positional argument is not a readable file → pasted prose.** Otherwise the trimmed argument (plus any prose the user typed in the same message) is the input. Record `{ kind: "pasted", ref: "inline", bytes: <utf-8 byte length of the combined text> }`.
3. **No argument → fall back to the last turn's transcript** (existing behavior). Scan tool calls, file edits, bash output, and assistant prose. Prefer tool-call results over prose — they are the ground truth of what the harness *did*. Record `{ kind: "transcript", ref: "last-turn", bytes: <approx transcript bytes> }`.
4. **Combine, don't replace.** If both a transcript and an explicit source exist (e.g., the user pasted prose AND there's a non-trivial transcript), merge them into one distillation. Each source is a separate entry in `sources[]`.

Soft cap: **~50KB per source, ~100KB combined**. Above that, prefer structure-first distillation: extract headings + fenced code blocks (for `.md`) or paragraph boundaries (for prose), then distill that skeleton into the ≤10 bullets. Do not hard-reject oversized inputs.

If `$text` was passed as a slash-command argument and it's empty, fall back to rule 3.

After Step 1 you hold in memory:

- `sources[]`       : `Array<SourceItem>`   (per the schema)
- `transcript text` : `string`              (the merged content to distill)
- `metadata`        : `{ ts, project, branch, model }`

### 2. Write the input handoff file

The parent writes **ONE** file — the input the subagent consumes. Wrap this in a single `Bash` tool call. The transcript text and the JSON-stringified `sources[]` are passed as positional arguments to `bash -c`, so the transcript never has to be escaped into a heredoc.

```bash
bash -c '
  INPUT_FILE="${TMPDIR:-/tmp}/digest-input-$(date +%s)-$$.txt"
  PROJECT="$(basename "${CWD:-$PWD}" 2>/dev/null || echo unknown)"
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo null)"
  MODEL="${PUKU_MODEL:-unknown}"
  SOURCES_JSON='"'"'$1'"'"'      # JSON-stringified sources[] from Step 1
  TRANSCRIPT="$2"   # merged transcript text

  {
    printf "%s\n\n" "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"project\":\"$PROJECT\",\"branch\":\"$BRANCH\",\"model\":\"$MODEL\",\"sources\":$SOURCES_JSON}"
    printf "%s" "$TRANSCRIPT"
  } > "$INPUT_FILE"
  echo "$INPUT_FILE"
' _ "$SOURCES_JSON" "$TRANSCRIPT_TEXT"
```

Notes:

- `$TMPDIR` with `/tmp` fallback for Linux/macOS/WSL portability.
- `$$` (parent PID) guarantees uniqueness across parallel `/digest` invocations.
- The trailing `echo "$INPUT_FILE"` writes to the **Bash tool's captured stdout**, not the user's terminal. Capture it (the second positional return of the Bash tool) so step 3 knows where the file landed.
- This is the only parent-side `Write`/file-mutation step.

**JSON chosen over `key=value`** because `sources[]` is structured (an array of objects with optional nested fields). JSON is one `JSON.parse`; key=value quoting of nested objects with optional unicode is a footgun.

### 3. Invoke the digest-renderer subagent

One `Agent` tool call:

```
Agent:
  description: "Render digest input file as HRP HTML report"
  subagent_type: "digest-renderer"
  prompt: |
    Input file: <abs INPUT_FILE path>
    Render it as an HRP v1 HTML report.
```

That's it — the `prompt` field contains **only the path**. All bulk content is on disk; the subagent re-reads it from there. The parent's transcript gains only the ~200-byte Agent call, not the multi-KB source text.

The subagent's contract (input format, return shape, failure modes) is defined in `./agents/digest-renderer.md` — refer to that file for the full pipeline (Steps 2–5 of the original `SKILL.md` now live there).

### 4. Terminal output — exactly one line

After the Agent call returns, parse its final JSON object and print exactly one line:

```
result = <parsed JSON from subagent>
if result.status == "ok":
    if result.path:
        print(result.path)
    else:
        # noop — subagent reported an empty transcript
        print("digest: noop — nothing to render")
else:
    error = result.error or "unknown error"
    print(f"digest: failed — {error}")
```

Hard rules:

- **One line.** No preamble, no banner, no "report written to…", no instructions, no extra blank lines.
- Print the path that was just written — not a templated example.
- No trailing punctuation.
- Do not echo the JSON envelope, the JSON file path, the `source_dir`, or any other metadata on stdout.
- Do not print ✓ checkmarks, ✗ errors, or status glyphs alongside the path.
- The parent does NOT retry, does NOT fall back to inline rendering, does NOT open the browser itself.

> Why one line? Terminal output is the user's working surface. Multi-line banners push the prompt up and make it harder to copy the path or chain commands. One clean line keeps the terminal scannable; the rendered HTML carries the rest.

---

## HRP v1 — schema (the subagent emits this)

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
    "source_dir": "string (optional) — absolute path to the temp dir holding this report. Powers 'Clean from Disk'.",
    "source_files": ["string (optional) — absolute paths of the written files (HTML + JSON)."],
    "sources": [SourceItem],
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

type SourceItem = {
  kind: "transcript" | "file" | "pasted",  // required
  ref: string,                            // required — 'last-turn' for transcript, the absolute path for file, 'inline' for pasted
  bytes?: number,                         // optional, ≥ 0
  label?: string,                         // optional, ≤ 80 chars; used as the visible pill text for "file" sources
};
```

A complete reference example is at `./example-report.json`. The subagent reads `./hrp.schema.json` and `./example-report.json` directly to validate its output.

---

## Rules (strict)

The subagent enforces these rules. The parent keeps them here as context.

1. **The JSON envelope is for the renderer, not the terminal.** Wrap it in a single ```json fenced block so the renderer can pick it up — but do **not** print it on stdout from the parent. The terminal gets exactly one line (the HTML path) per Step 4.
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
12. **The subagent does not write HTML by hand.** If the renderer breaks, fix the schema — not the template.
13. **`sources[]` is optional.** When the parent passes it through, every active input goes in: `transcript` (always emitted if you read the transcript), `file` (when the user passed a path), `pasted` (when the user pasted prose). The renderer shows them as pills in the Overview card.

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
| `./hrp.schema.json` | JSON Schema 2020-12 reference. Subagent reads this directly. |
| `./example-report.json` | Standalone reference payload (Docs Diátaxis Migration). Subagent reads this directly. |
| `./harness-report.html` | Data-driven HTML template. Hydrated by renderer.js from inline JSON. Single theme, single-column, flat — no decoration. |
| `./renderer.js` | Vanilla-JS hydration script. Zero deps. |
| `./agents/digest-renderer.md` | **Dedicated subagent.** Owns git evidence, HRP distillation, HTML+JSON file writes, and browser open. Invoked from this skill via the `Agent` tool. |
| `${TMPDIR:-/tmp}/digest-input-<ts>-$$.txt` | **Per-run input handoff file** (parent writes in Step 2; subagent reads in its Step 1). Auto-cleaned by the OS. |
| `${TMPDIR:-/tmp}/harness-reports-<ts>-$$/` | **Generated report directory** (subagent creates in its Step 5). Contains `harness-report-<ts>.html` and `harness-report-<ts>.json`. The HTML's "Clean from Disk" button deletes this directory. |

---

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
