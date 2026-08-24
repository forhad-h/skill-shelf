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

## Output target — single rule

**Resolve `output_path` (first match wins):**
1. From the `output_path` arg if provided.
2. Else, if `input_path` was provided → use `input_path`.
3. Else → `stdout` (no file written).

**Write:**
- When the resolved output path **differs** from `input_path`, **overwrite** the output file entirely with `draft_final`.
- When the resolved output path **equals** `input_path`, **append** `draft_final` to the file, separated from prior contents by a single blank line.
- When the target is `stdout`, skip the file write.

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

### Step 2 — Run the pipeline

The pipeline has two modes. Choose the mode **before** invoking any sub-skill, based on what the draft is trying to communicate.

#### Decide the mode

**Mode A — full pipeline** — use when `draft_raw` contains any **verifiable technical, legal, medical, scientific, or financial claim**. The trigger is **claim presence**, not genre — a personal reflection that embeds a verifiable factual claim (for example, "I feel tired because React 18 introduced concurrent rendering") still goes through Mode A. Specifically:

- A claim about a specific technology, framework, tool, library, language version, API behavior, or benchmark
- A claim about a law, regulation, contract, license, or legal right/obligation
- A claim about a drug, treatment, diagnosis, symptom, or medical guideline
- A claim about a scientific fact, statistic, study result, or research finding
- A claim about a financial product, tax rule, market data, or investment outcome
- Named numbers, dates, percentages, or measurements presented as fact

**Mode B — short pipeline** — use when the draft is:

- A personal feeling, reflection, mood, or life experience
- A motivational or philosophical musing
- A generic career/learning/life lesson with no factual claims to verify
- Pure storytelling or anecdote

**When in doubt, use Mode A.** The cost of an extra validation is lower than publishing a wrong technical claim.

#### Mode A — full pipeline

Why three rows: the validator's `Corrected:` substitutions may introduce (a) **spelling drift** — a substituted term may end up misspelled against Bangla Academy rules, and (b) **punctuation drift** — দাঁড়ি, কমা, hyphen, etc. around the substituted terms may become inconsistent. The second proofread pass realigns substituted terms with Bangla Academy rules.

**Division of labor:**
- The **validator** corrects factual claims (term-level: e.g. `রিঅ্যাক্ট` → `React`, `Postgres 16` → `PostgreSQL 16`).
- The **proofreader** corrects spelling and punctuation against Bangla Academy rules (e.g. `এড়িয়া` → `এড়িয়ে`, normalization of দাঁড়ি / কমা / hyphen).

The validator itself does **not** write a corrected draft. It only emits an `ISSUES` list with `Corrected:` fragments. This parent skill applies those substitutions.

**Pipeline row 1 — proofread pass 1**

Invoke `/bengali-proofreader` with `draft_raw`.

Capture:
- `--- CORRECTED DRAFT ---` block → `draft_v1`
- `--- CHANGES ---` block → `changes_v1`

**Pipeline row 2 — validate**

Invoke `/bengali-concept-validator` with `draft_v1`.

Capture:
- `--- ISSUES ---` list, each with its `Corrected:` line → `issues`
- `--- FLAGS ---` list → `flags`

**Apply corrections.** For each item in `issues`, substitute the `Corrected:` fragment for the original fragment in `draft_v1` to produce `draft_v2`. Substitutions are applied in the order the issues appear in the validator's report. Do not rewrite for style — the corrected fragment is taken verbatim from the validator.

**Pipeline row 3 — proofread pass 2**

Invoke `/bengali-proofreader` with `draft_v2`.

Capture:
- `--- CORRECTED DRAFT ---` block → `draft_final`
- `--- CHANGES ---` block → `changes_v2`
- `--- SUGGESTIONS ---` block → `suggestions`

#### Mode B — short pipeline

No validator pass, no second proofread pass — the first proofread is the final proofread. There is nothing to realign because nothing was substituted.

**Pipeline row 1 — proofread pass 1**

Invoke `/bengali-proofreader` with `draft_raw`.

Capture:
- `--- CORRECTED DRAFT ---` block → `draft_final`
- `--- CHANGES ---` block → `changes_v1`
- `--- SUGGESTIONS ---` block → `suggestions`

---

Never write `draft_v1`, `draft_v2`, or any intermediate to disk mid-pipeline. Never show `draft_v1` or `draft_v2` to the user. The user only sees the result of Step 4.

### Step 3 — Output to the user

Bengali script does not render in some terminals, so avoid dumping Bengali into chat unless there is no other place for it. The chat output is a **short English summary**; the file write carries the Bengali.

**If a file was written** (separate output path or appended to `input_path`):

Keep chat output to a single short English paragraph — at most. Emit one line such as:

```
Written to: <path>. Validator flagged N issue(s); see file for corrected draft.
```

Optionally follow with one short English paragraph summarizing what changed (e.g. "Fixed spelling of React 18, PostgreSQL 16, এড়িয়ে → এড়িয়ে; punctuation around প্রতিটি normalized."). Do not paste the Bengali drafts.

**If there is no file to write** (target was `stdout`):

Print the full polished post and warnings so the user can copy them out:

```
--- POLISHED POST ---
<draft_final, ready to paste>

--- WARNINGS ---
Group items by the sub-skill that produced them, in collection order
within each group.

Mode A (full pipeline):
  WARNINGS = flags (verbatim from validator) ∪ suggestions (verbatim from proofreader pass 2).

bengali-concept-validator:
- <flag 1, verbatim>
- <flag 2, verbatim>
(if none: "no flags")

bengali-proofreader (pass 2):
- <suggestion 1, verbatim>
(if none: "no suggestions")

Mode B (short pipeline):
  WARNINGS = suggestions (verbatim from proofreader pass 1 only).

bengali-concept-validator:
- not invoked

bengali-proofreader (pass 1):
- <suggestion 1, verbatim>
(if none: "no suggestions")
```

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
