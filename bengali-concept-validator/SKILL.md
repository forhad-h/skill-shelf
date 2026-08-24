---
name: bengali-concept-validator
description: Validate technical, legal, medical, and scientific claims in a Bengali-script draft and return a report with corrected versions for each error.
when_to_use: Use this skill when the user has a Bengali-script draft that contains technical, legal, medical, scientific, or financial claims that should be checked before publication. Do NOT use this skill for: spelling or punctuation fixes (use bengali-proofreader), English-only drafts, mixed Banglish (Latin script), or speculative or opinion content. Output is a report only — this skill never writes to the user's draft file. This is a sub-skill of bengali-post-editor and is normally invoked through it; do not auto-invoke on its own.
---

# Bengali concept validator

Validate the technical, legal, medical, and scientific claims in a Bengali draft and **return a validation report** with the corrected version of every wrong claim attached. The skill does not rewrite the user's draft in place and does not write any file on disk — but it does compute the correct version of each flagged claim so the next step (the user, the proofreader, or the editor) can apply it directly.

This skill is a **concept validator and corrector**, not a proofreader, not a writer, and not an editor. It does not modify the draft file. It validates claims, proposes the correct version, and hands that off.

## What this skill does

For every technical, legal, medical, or scientific claim in the draft, report:

- **Verifiable and wrong:** flag it and propose the corrected version. Cite the source (e.g. "Bangla Academy", "PostgreSQL 16 docs", "Bangladesh Copyright Act 2000 §X"). The corrected version is for the next step to apply, not for this skill to write into the file.
- **Common misconception:** flag it and propose the corrected version. Mark it as "common misconception".
- **Unverifiable and costly (legal, medical, financial):** flag it as **needs verification by a qualified source**. Do not propose a correction.
- **Cannot verify inside the skill:** say so plainly. "I cannot verify this inside the skill. Recommend a qualified source." Never invent correctness.

**Only flag genuine errors.** Do not touch opinions, stylistic choices, metaphors, future predictions, or personal experience claims.

If the draft has no tech/legal/medical claims, the ISSUES section reads "no concept issues" and the VALIDATION REPORT is empty.

## Standard

Bangladeshi and South Asian context by default. When the user references another jurisdiction, follow that jurisdiction.

Legal citations should match the **current** state of the law as of 2026. Flag references to repealed acts or superseded sections.

## Workflow

### Step 1 — Read the input, don't interview

Read the draft. Do not ask about audience, tone, length, or register. If the draft is missing a hard fact needed to verify a claim, ask **one** question. Never ask about style.

If the input is empty or only English, ask for the Bengali draft.

### Step 2 — Read the fact-check reference

Open `references/fact-check-prompts.md`. It defines the prompt categories (technical, legal, medical, scientific, financial), the self-check before output, and the flag format.

Apply every prompt in every relevant category to every claim in the draft.

### Step 3 — Build the validation report

Walk the draft sentence by sentence. For each sentence:

- If it contains a demonstrably wrong factual claim, log it under ISSUES with the original sentence fragment and the **corrected version** ready for the next step to apply. Do **not** rewrite the draft file.
- If it contains an unverifiable-but-costly claim (legal, medical, financial), log it under FLAGS only. No corrected version is proposed.
- If it contains an opinion, metaphor, or stylistic choice, leave it untouched — no entry in the report.

When the correction involves a number, statute, or proper noun, use the canonical form. Example: "১০% = fair dealing" → corrected version "case-by-case under §17(1) of the Copyright Act 2000".

When the user's draft is ambiguous and the correction could go two ways, prefer the correction that preserves the user's sentence structure. If ambiguity is too high to resolve, flag it as "needs verification" rather than guessing.

If a spelling or punctuation error is spotted during validation, ignore it — that is `bengali-proofreader`'s job.

### Step 4 — Output

The output is a **validation report** that lists each issue and attaches the corrected version for the next step. The skill does **not** rewrite the draft in place and does **not** write to any file on disk — the user (or a downstream skill) applies the corrections.

```
--- VALIDATION REPORT ---
<the full Bengali draft is echoed back, unchanged, so the user can
keep it in view. The skill does not modify it.>

--- ISSUES ---
<numbered list. Each item: the original line, the corrected version
ready for the next step to apply, what was wrong, and the source.>

Format per item:
1. <original sentence fragment>
   Corrected: <corrected sentence fragment>
   Why: <one-line explanation of what was wrong>
   Source: <where the correction comes from, e.g. "Bangladesh Copyright Act 2000 §17" or "React 18 docs" or "common misconception">

If no concept issues were found, say "no concept issues".

--- FLAGS ---
<numbered list of claims that could not be verified — typically
legal/medical/financial claims the skill could not verify. No
corrected version is proposed for these.>

Format per item:
NEEDS VERIFICATION: "<the line as written>"
What is wrong: <one-line explanation of why this is risky>
Recommendation: <suggest a qualified source, e.g. "consult a Bangladesh-licensed lawyer" or "verify with a qualified medical professional">

If nothing was flagged, say "no flags".

--- NOTES ---
Claims reviewed: <n> · Concept issues: <n> · Flags: <n> ·
Spell/punctuation: 0
Draft rewritten: no
File written: no
```

## Hard rules

- **Return a report with corrected versions attached; never rewrite the draft in place.** The skill produces the correct version of each wrong claim and hands it to the next step. It does not modify the user's draft or write a corrected file.
- **Never write to the draft file.** No file is created or modified by this skill. The user (or a downstream skill) applies the corrections themselves.
- **Never rewrite the user's voice.** The corrected version preserves tone, register, sentence length, and dialect — only the fact changes.
- **Never change spelling or punctuation.** Deferred to `bengali-proofreader`. Mixing the two skills' responsibilities is a hard error.
- **Never translate English technical terms into Bengali.** Keep Latin-script terms as-is in the corrected version.
- **Never invent a correction.** If the claim is not verifiable inside the skill, do not propose a correction; flag it in FLAGS instead.
- **Never flag opinions, metaphors, or future predictions.** Predictions are not fact-checkable.
- **Never add a closing moral or universal lesson.** The user did not ask for one.
- **The corrected version preserves sentence length and order** of the original. No reordering, adding, or removing sentences inside the corrected fragment.
- **If concept-validator and the user's later proofreader disagree** — e.g. concept-validator proposed a corrected sentence and the proofreader wants to change a word in the same sentence — each skill reports its own change independently. They do not collapse.

## Anti-patterns

- Rewriting the draft in place and returning it as if it were a "validation". This skill only validates and proposes corrections; it never edits the file.
- Writing the corrected text into a file on disk. The skill returns the report to the user, period.
- Mixing spelling/punctuation fixes into a concept report. Stay in your lane.
- Marking metaphors, opinions, or predictions as factual errors.
- Adding a hopeful closing line ("আশা করি এটি সহায়ক হবে!").
- Inventing a citation (e.g. "according to Section 4.2 of the X act") when the actual section number is unknown.
- Flagging a Bengali term as "anglicism" when it is the canonical Bengali word (e.g. "তথ্য" is not "data" — it is the Bengali word).
- Citing "common knowledge" as a source. Common knowledge is not a citation.
- Proposing a correction for a legal/medical/financial claim the skill cannot verify. Flag it instead and leave the corrected-version field blank.

## When to push back

- If the user asks for a full rewrite, say so and ask them to confirm before doing it. This skill reports facts and proposes corrections; it does not fix structure.
- If the user asks for spelling or punctuation fixes, say so. The `bengali-proofreader` skill does that.
- If the user asks for the corrected draft to be saved to a file, say so. This skill returns the corrected version in the report; it never writes files.
- If the user asks for engagement suggestions, say so. Neither skill does that — that is the user's own editing.
- If the user provides a draft in mixed Banglish (Latin script), ask them to convert to Bengali script first. The skill's rules apply to Bengali script.

## Files in this skill

- `references/fact-check-prompts.md` — prompt categories, self-check, flag format

## Limitations

- The skill relies on the model's existing knowledge plus the references. Where the model genuinely does not know, it must say "needs verification" — never invent.
- The references cover the most common categories (technical, legal, medical, scientific, financial). Edge-case domains (e.g. aerospace, pharmacology) are out of scope unless the user adds a reference.
- The skill does not connect to a live fact database. Adding that would be a separate tool, not a skill.
- The skill does not browse the web. If the user wants a web check, they must invoke a tool that can browse.
- The skill proposes a corrected version only for verifiable wrong claims. Legal/medical/financial claims that cannot be verified are flagged without a corrected version, to avoid putting risky advice into the report.
- The skill never writes the corrected draft to disk. Applying the corrections is the user's responsibility, either manually or via a downstream skill.