---
name: bengali-post-editor
description: Polish a Bengali-script draft into a publication-ready post.
allowed-tools:
  - Read
  - Write
  - Bash
when_to_use: Use this skill when the user provides a draft in Bengali script intended to polish and fix linguistic issues. Do NOT use this skill for: English-only drafts, drafts in mixed Banglish (Latin script), code-only content, or short conversational messages. If a draft is not in Bengali script, simply do nothing — ignore it and do not invoke any sub-skill or write any file.
argument-hint: "<input_path> [<output_path>]"
arguments:
  - input_path
  - output_path
context: inline
---

# Bengali Post Editor

Take a raw Bengali draft through a sequential pipeline of sub-skills and write the publication-ready final post to a path the user provides. Each sub-skill owns its own rules; this skill only routes, threads outputs, applies the validator's `Corrected:` substitutions, and guards the contract.

---

### Step 1 — Read the input

Resolve inputs in this order. Do not ask about audience, tone, length, or register.

**`input_path`:**
1. From the `input_path` arg if provided.
2. Else from the user's message body (treat the prose as the draft).

Read the file or capture the message body as `draft_raw`.

Capture `output_path` if the user provided one as an arg; otherwise leave it for the Output target section above.

### Step 1.5 — Bengali script gate

**Check:** If `draft_raw` contains no characters in the Bengali Unicode block (`U+0980`–`U+09FF`), or if `draft_raw` is empty, simply abort — do not invoke any sub-skill, do not write any file, and do not produce chat output. Silently ignore non-Bengali or empty input.

This gate runs **before** Step 2 so the pipeline is not executed on non-Bengali or empty input.

---

## Hard rules — pipeline enforcement

These rules apply to both Mode A and Mode B. Violating any of them is a contract breach.

1. **You MUST invoke each required sub-skill as a separate skill-invocation call.** Do not run their workflow in-line by re-reading their SKILL.md and impersonating them. Use whatever invocation primitive your environment exposes — the contract is the separate invocation, not the syntax.
2. **You MUST NOT skip a pipeline row.** Every row listed under §"Mode A" or §"Mode B" is required, not optional. "The result already looks good" or "no factual claims spotted" are not valid reasons to skip Row 2 / Row 3 — only the Mode B trigger criteria in §"Decide the mode" can drop the validator row.
3. **You MUST NOT write `draft_final` (or any intermediate) to disk until every required row has produced its captured output.** Treat the absence of `draft_v1`, `issues`, or `draft_final` as a bug, not a shortcut.
4. **You MUST capture the exact block names** each sub-skill emits (see "Block contract" below). If a sub-skill returns prose instead of the named block, that is the sub-skill failing — re-invoke it or stop and tell the user.
5. **You MUST NOT print `draft_v1`, `draft_v2`, or `draft_final` to chat** unless the output target is `stdout` (see Step 4). Chat carries a one-line English summary only.

### Block contract — what each sub-skill emits

| Sub-skill | Input | Output blocks you MUST capture |
|---|---|---|
| `bengali-proofreader` | inline Bengali text | `--- CORRECTED DRAFT ---`, `--- CHANGES ---`, optionally `--- SUGGESTIONS ---`, `--- NOTES ---` |
| `bengali-concept-validator` | inline Bengali text | `--- VALIDATION REPORT ---`, `--- ISSUES ---`, `--- FLAGS ---`, `--- NOTES ---` |

If a captured block is missing or the sub-skill refused to run (e.g. "input is empty or only English"), STOP the pipeline and report the failure in chat. Do not silently produce `draft_final` from partial inputs.

### Step 2 — Decide the mode

Scan `draft_raw` once. Choose **exactly one** mode:

- **Mode A** — `draft_raw` contains any verifiable technical, legal, medical, scientific, or financial claim. Trigger is claim presence, not genre. Specifically: claims about a technology / framework / tool / API / version / benchmark; laws or regulations; drugs or treatments; scientific facts or statistics; financial products or market data; named numbers / dates / percentages presented as fact.
- **Mode B** — `draft_raw` is purely personal feeling, reflection, motivational, or storytelling with no factual claims to verify.

**When in doubt, Mode A.** The cost of an extra validation is lower than publishing a wrong technical claim.

State the chosen mode in chat (one sentence) before invoking any sub-skill. The statement is for traceability, not the user — keep it brief.

### Step 3 — Run the pipeline (mandatory order)

You MUST run every row below, in order, as a separate skill-invocation call. Do not skip a row. Do not collapse two rows into one call.

**Mode A — full pipeline (3 rows):**

1. **Row 1 — Proofread pass 1.** Invoke the `bengali-proofreader` skill with `draft_raw`. Capture the `--- CORRECTED DRAFT ---` block as `draft_v1` and the `--- CHANGES ---` block as `changes_v1`.
2. **Row 2 — Validate concepts.** Invoke the `bengali-concept-validator` skill with `draft_v1`. Capture `--- ISSUES ---` as `issues` and `--- FLAGS ---` as `flags`. Apply each `Corrected:` substitution from `issues` to `draft_v1` in the order they appear, producing `draft_v2`. Substitutions are verbatim — no rewriting for style.
3. **Row 3 — Proofread pass 2.** Invoke the `bengali-proofreader` skill with `draft_v2`. Capture `--- CORRECTED DRAFT ---` as `draft_final`, `--- CHANGES ---` as `changes_v2`, and `--- SUGGESTIONS ---` (if present) as `suggestions`.

If any row fails to produce its named block, STOP. Do not proceed to Step 4. Report the failing row to the user in chat.

**Mode B — short pipeline (1 row):**

1. **Row 1 — Proofread pass 1.** Same as Mode A Row 1 (invoke the `bengali-proofreader` skill with `draft_raw`). `draft_final = draft_v1`.

You MUST NOT use `draft_raw` as `draft_final`. That is a bypass.

### Step 4 — Write to disk

Resolve `output_path` (first match wins):
1. From the `output_path` arg if provided.
2. Else, if `input_path` was provided → use `input_path`.
3. Else → `stdout` (no file written).

Write rules:
- `output_path` differs from `input_path` → overwrite output file entirely with `draft_final`.
- `output_path` equals `input_path` → **append** a structured block to the file in this exact format:

  ```markdown
  ---

  ## Polished Draft — <YYYY-MM-DD>

  <draft_final, verbatim>

  <details>
  <summary>✏️ Changes (<N> fixes)</summary>

  <changes_block, see Step 4.5>

  </details>
  ```

  Where `<YYYY-MM-DD>` is today's date in ISO 8601 (use the current date, not the file's mtime). The horizontal rule `---` and the `##` heading are mandatory — they give the polished version a visible boundary and an Obsidian outline entry, so it does not blend into the original draft above it. The `<details>` block is **also mandatory when there were any changes**, and collapsed by default so it does not clutter normal reading of the polished draft. If every section of the change log below is empty (no spelling, no validator, no pass-2), emit `<summary>✏️ Changes (no fixes)</summary>` followed by an empty body — do not omit the block.
- Target is `stdout` → skip file write, print `draft_final` and warnings instead.

### Step 4.5 — Build the changes block

You MUST build the `<details>` body from the captured outputs (`changes_v1`, `issues`, `flags`, `changes_v2`, `suggestions`). The body has three sections, in this order. If a section is empty, omit its `**heading:**` line entirely (do not print "no changes" placeholders inline — keep the file tidy).

```markdown
**Spelling (proofreader pass 1):**
- <change 1 verbatim from changes_v1>
- <change 2 verbatim>
...

**Concepts (concept-validator):**
- <issue 1: original fragment → corrected fragment, with one-line why>

**Re-proof (proofreader pass 2):**
- <change verbatim from changes_v2, if any — this pass catches spelling drift introduced by validator substitutions>
```

Rules:
- Each line is one bullet, plain markdown. No code fences around individual entries.
- Take items **verbatim** from the sub-skill outputs. Do not paraphrase, do not translate rule names into English, do not number them — the source skill already numbered them.
- `suggestions` from proofreader pass 2 are stylistic and **MUST NOT** go into the changes block. Suggestions belong in chat (Mode B) or are dropped (Mode A — they would re-trigger noise). If `suggestions` is non-empty in Mode A, briefly note "Proofreader pass 2 had some suggestions — see chat" in the `**Re-proof**` section instead of listing them.
- For Mode B, only `changes_v1` is present. Use the single section `**Spelling (proofreader pass 1):**` and omit the other two headings.
- Total fix count `<N>` in the `<summary>` line is the sum of `changes_v1 + issues + changes_v2` items (Mode A) or `changes_v1` items (Mode B).

You MUST write before producing chat output. Do not print a "done" message without a successful Write call (or an explicit `stdout` fallback).

### Step 5 — Chat output

If a file was written: emit one short English line such as `Written to: <path>. Validator: <n> issues, <n> flags. Proofreader: pass 1 <n> changes, pass 2 <n> changes.` Optionally one more short English sentence summarizing what changed. No Bengali in chat.

If target is `stdout`: print `--- POLISHED POST ---`, `draft_final`, then `--- WARNINGS ---` grouped by sub-skill (same format as the original SKILL.md).

---

## Worked example

Input draft (3 lines, Bengali):

```
রিঅ্যাক্ট ১৮ এ useEffect এর dependency array পরিবর্তন এড়িয়া চলা উচিত।
Postgres ১৬ এ প্রতি row এবং প্রতি query এ MVCC থাকে।
আমাদের দল সবসময় ভুল বানান এড়িয়া চলে।
```

Pipeline result when the target is a file (no Bengali in chat):

```
Written to: ./draft.md. Validator: no flags. Proofreader pass 2: no suggestions.
Summary: corrected রিঅ্যাক্ট → React, Postgres 16 → PostgreSQL 16, এড়িয়া → এড়িয়ে; normalized punctuation around প্রতিটি / query.
```

File contents after append (the original draft is unchanged; the polished version + collapsible change log are appended):

```
রিঅ্যাক্ট ১৮ এ useEffect এর dependency array পরিবর্তন এড়িয়া চলা উচিত।
Postgres ১৬ এ প্রতি row এবং প্রতি query এ MVCC থাকে।
আমাদের দল সবসময় ভুল বানান এড়িয়া চলে।

---

## Polished Draft — 2026-08-24

React 18 এ useEffect এর dependency array পরিবর্তন এড়িয়ে চলা উচিত।
PostgreSQL 16-এ প্রতিটি row-এবং প্রতিটি query-তে MVCC থাকে।
আমাদের দল সবসময় ভুল বানান এড়িয়ে চলে।

<details>
<summary>✏️ Changes (3 fixes)</summary>

**Spelling (proofreader pass 1):**
- এড়িয়া → এড়িয়ে — common-errors §6

**Concepts (concept-validator):**
- রিঅ্যাক্ট ১৮ → React 18 — common misconception (React 18 docs)
- Postgres ১৬ → PostgreSQL 16 — proper noun normalization
- প্রতি row / প্রতি query → প্রতিটি row / প্রতিটি query — Bangla Academy canonical form

**Re-proof (proofreader pass 2):**
- (none — validator substitutions did not introduce drift)

</details>
```

Pipeline result when the target is `stdout` (full draft printed so the user can copy):

```
--- POLISHED POST ---
React 18 এ useEffect এর dependency array পরিবর্তন এড়িয়ে চলা উচিত।
PostgreSQL 16-এ প্রতিটি row-এবং প্রতিটি query-তে MVCC থাকে।
আমাদের দল সবসময় ভুল বানান এড়িয়ে চলে।

--- WARNINGS ---
bengali-concept-validator:
- no flags

bengali-proofreader (pass 2):
- no suggestions
```