---
name: bengali-proofreader
description: Proofread a Bengali-script draft — fix spelling and punctuation against Bangla Academy rules. Optionally suggest more engaging sentence patterns.
when_to_use: Use this skill when the user has a Bengali-script draft that needs spelling and punctuation cleanup. Use it for tech writing, blog posts, social media posts in Bengali script. Do NOT use this skill for: fact-checking technical, legal, or medical claims; English-only drafts; pure Banglish (Latin script only); grammar corrections (verb conjugation, case marking); or full rewrites. This skill proofreads — it does not write. Note: mixed Bengali-script + Latin-script text is supported (code-mixing).
---

# Bengali proofreader

This skill proofreads a Bengali-script draft. It fixes spelling and punctuation against Bangla Academy rules. If the user's prompt asks for engagement improvements, it also offers optional sentence-level suggestions. It never rewrites the user's voice, never translates English technical terms into Bengali, never fact-checks claims.

Input: a Bengali-script draft.
Output: the corrected draft, a numbered list of every change with its rule, optional suggestions, and a short notes block.

## Standard

Bangla Academy (`বাংলা একাডেমি বাংলা ভাষার বানান অভিধান`). Bangladeshi standard.

When the Bangla Academy and Sahitya Samsad disagree, follow Bangla Academy. When the Academy allows both forms, prefer the one dominant in modern Bangladeshi tech writing.

When the rule is unclear and the lookup exceeds the references, mark the word as `needs verification` in NOTES. Never invent a correction.

### When to use CHANGES vs SUGGESTION vs needs verification

The three categories are distinct:

- **CHANGES** — the model can cite a specific rule (Bangla Academy, conjunct-rules.md, etc.) that the user's spelling violates. The corrected draft replaces the original; the rule is listed in the CHANGES section.
- **SUGGESTION:** — the user used a non-Academy form that is also widely accepted, or the model can offer an alternative without claiming the user's form is wrong. The corrected draft preserves the user's spelling; the suggestion appears in the SUGGESTIONS section.
- **needs verification** — the word is not in the references and the model is genuinely uncertain about the Bangla Academy ruling. The corrected draft preserves the original spelling; the word is flagged in NOTES with `needs verification`.

**Boundary:** if the model can cite a specific rule → CHANGES. If the model can offer an alternative but not cite a rule → SUGGESTION. If the model is uncertain → needs verification.

## Code-mixing

See `references/code-mixing.md`. Short version: keep Latin-script English terms as-is. If the user transliterated a dominant English tech term into Bengali script (e.g. "রিঅ্যাক্ট", "ডাটাবেস", "ফাংশন"), flag once as `SUGGESTION:` (code-mix: consider the Latin-script form). Never translate proper nouns, product names, or framework names.

## Workflow

### Step 1 — Read the input

The user has a draft. Read it. Do not ask about audience, tone, length, or register. This skill does not interview — it proofreads.

If the input is empty or only English, ask for the Bengali draft.

### Step 2 — Spelling and punctuation pass

Read the references in order. Apply every rule. Cite the rule name in the CHANGES section so the user can verify.

1. `references/spelling-confusions.md` — শ/স/ষ, ন/ণ, ব/ভ, র/ড়/ঢ়, হ/হ্র, ং/ঁ, ই/ঈ, য/জ, etc.
2. `references/conjunct-rules.md` — যোজক, রেফ, ল-ফলা, হ্রস্ব/দীর্ঘ vowels, তৎসম retention.
3. `references/punctuation.md` — দাড়ি, কমা, দ্বৈত দাড়ি, mixing with English punctuation.
4. `references/common-errors.md` — top errors seen in Bengali tech writing.

`spelling-confusions.md` §হ/রেফ and `conjunct-rules.md` §2 (রেফ) overlap by design — cross-check both before flagging.

For each correction, note:
- The original word
- The corrected word
- The rule that triggered it (rule name + one-line reason)

When two valid spellings exist, prefer the Bangla Academy ruling. If the user used a non-Academy spelling that is also widely accepted (e.g. তদ্ভব where তৎসম is canonical), do not "correct" it — flag it as `SUGGESTION:`.

### Step 3 — Engagement (only if triggered)

**Trigger condition:** The user's prompt must explicitly ask for engagement improvements (e.g. "suggest more engaging patterns", "improve flow", "make it more readable"). If the user has not asked, skip Step 3 entirely and omit the `--- SUGGESTIONS ---` block.

When triggered:

1. Read `references/engagement.md` for the full rules.
2. Scan the corrected draft for clearly flat, wordy, or repetitive sentences. The bar is high — suggest at most 1-3 sentences per draft.
3. For each candidate sentence, run the self-check: does it preserve the user's voice? Does it change facts or technical terms? Would the user likely agree?
4. If the rewrite passes the self-check, mark it as `SUGGESTION:` (never as a CHANGES entry).
5. Format each entry as: `SUGGESTION: "<original>" → "<suggested>" — Why: <one-line reason>`

**Never suggest:**
- Rewrites of factual content
- Changes to dialectal or formal registers
- Substitutions of technical terms
- More than 1-3 total suggestions per draft

If no sentence passes the bar, emit the SUGGESTIONS block as empty? **No — omit the block entirely.**

### Step 4 — Output

If Step 3 was triggered:

```
--- CORRECTED DRAFT ---
<the full corrected Bengali text, ready to paste>

--- CHANGES ---
<numbered list of every spelling / punctuation correction, with the rule
that triggered it. Format: "1. <original> → <corrected> — <rule name>: <reason>">

--- SUGGESTIONS ---
<numbered list. Each item: the line, the suggested re-phrase, why.
Mark every one as SUGGESTION.>

--- NOTES ---
Standard: Bangla Academy · Words corrected: <n> · Punctuation: <n> ·
Suggestions: <n> · Needs verification: <n>
```

If Step 3 was not triggered, omit the `--- SUGGESTIONS ---` block:

```
--- CORRECTED DRAFT ---
<the full corrected Bengali text, ready to paste>

--- CHANGES ---
<numbered list of every spelling / punctuation correction, with the rule
that triggered it. Format: "1. <original> → <corrected> — <rule name>: <reason>">

--- NOTES ---
Standard: Bangla Academy · Words corrected: <n> · Punctuation: <n> ·
Needs verification: <n>
```

## Hard rules

- **Never rewrite the user's voice.** Tone, register, sentence length, dialectal forms — all are inputs.
- **Never fact-check inside this skill.** If a sentence looks factually wrong, leave it. The user can ask a separate fact-check pass.
- **Never translate English technical terms into Bengali.** Latin-script technical terms stay in Latin script. Bengali-script transliterations get a SUGGESTION, never a CHANGE.
- **Never invent a correction.** Words not in the references and not verifiable from Bangla Academy rules are flagged as `needs verification` in NOTES. The original spelling is preserved in the CORRECTED DRAFT.
- **Never add a closing moral or universal lesson.** The user did not ask for one.
- **Every change in the corrected draft must be listed in CHANGES with the rule that triggered it.** No silent edits. No "while I was at it" punctuation changes. The corrected draft and the original differ only by the entries listed in CHANGES and SUGGESTIONS.
- **If the user mixed দাড়ি (।) and English period (.) deliberately, keep the mix.** Do not standardize.
- **If Step 3 was not triggered, omit the SUGGESTIONS block.** Do not emit an empty SUGGESTIONS section.

## Anti-patterns

- Translating "frontend" to "ফ্রন্টেন্ড" and flagging "frontend" as wrong.
- Flagging a factual error as a "misunderstanding" — leave fact-checking outside this skill.
- Adding a hopeful closing line ("আশা করি এটি সহায়ক হবে!").
- Replacing দাড়ি (।) with English period (.) across the whole draft when the user mixed them on purpose.
- Inventing a citation for a fact-check (e.g. "according to Section 4.2 of the X act").
- Flagging a Bengali term as "anglicism" when it is the canonical Bengali word (e.g. "তথ্য" is the Bengali word for "data", not a transliteration).
- Auto-correcting dialectal forms (করতেছি, এস, আছ, চলতেছে). Dialectal forms are valid in their registers; never rewrite them.
- Correcting grammar (verb conjugation like চাই/চায়, case marking like অনেক লোককে, subject-verb agreement). Grammar is out of scope.
- Emitting `--- SUGGESTIONS ---` with "no suggestions" or empty body. If Step 3 was not triggered, omit the section.

## When to push back

- **Full rewrite** — say so. Ask the user to confirm before doing it. This skill is a proofreader.
- **Tone change** (e.g. "make it more formal") — say so. The skill does not write a new voice.
- **Fact-checks** — say so. This skill proofreads; it does not verify claims.
- **Banglish draft** (Latin script) — ask the user to convert to Bengali script first. The skill's rules apply to Bengali script.
- **Single-word or very short drafts** — say so. There is nothing to proofread; running the skill would just bounce the input back.

## Files in this skill

- `references/spelling-confusions.md` — consonant pairs (শ/স/ষ, ন/ণ, etc.)
- `references/conjunct-rules.md` — যোজক, রেফ, vowel length, তৎসম, diagnostic flow
- `references/punctuation.md` — দাড়ি, কমা, mixed punctuation
- `references/common-errors.md` — top errors in Bengali tech writing
- `references/code-mixing.md` — when to keep English, when to flag
- `references/engagement.md` — opt-in sentence-level engagement rewrites

## Cross-reference index

When you see an error pattern, look here first:

| Error type | Reference file | Section |
|---|---|---|
| শ / স / ষ confusion | spelling-confusions.md | §শ/স/ষ |
| ন / ণ confusion | spelling-confusions.md | §ন/ণ |
| ব / ভ confusion | spelling-confusions.md | §ব/ভ |
| র / ড় / ঢ় confusion | spelling-confusions.md | §র/ড়/ঢ় |
| হ / হ্র confusion | spelling-confusions.md | §হ/হ্র |
| ং / ঁ confusion | spelling-confusions.md | §ং/ঁ |
| য / জ confusion | spelling-confusions.md | §য/জ |
| যোজক dropped (e.g. পরকাশ) | conjunct-rules.md | §1 যোজক |
| র-ফলা missing (e.g. করম) | conjunct-rules.md | §2 র-ফলা |
| হ্রস্ব / দীর্ঘ vowel error | conjunct-rules.md | §3 vowel length |
| তৎসম retention error | conjunct-rules.md | §4 তৎসম |
| Conjunct forgotten (e.g. বাবহার) | conjunct-rules.md | §5 common conjuncts |
| ঋ vowel error (e.g. রিষি) | conjunct-rules.md | §6 ঋ vowel |
| য / য় confusion (e.g. প্রযোজন) | conjunct-rules.md | §7 য vs য় |
| এ-কার / ও-কার confusion | conjunct-rules.md | §8 vowel length |
| অপিনিহিত অ issue | conjunct-rules.md | §9 অপিনিহিত অ |
| দাড়ি vs period mixing | punctuation.md | §দাড়ি, §Mixing |
| দ্বৈত দাড়ি in modern prose | punctuation.md | §দ্বৈত দাড়ি |
| Top spelling/punctuation errors | common-errors.md | §1-20 |
| Code-mix / Latin script terms | code-mixing.md | §Boundary |
| Engagement rewrites | engagement.md | (full file) |

**Note on overlap:** `spelling-confusions.md` §হ/রেফ and `conjunct-rules.md` §2 (র-ফলা) overlap on হ্র. Cross-check both before flagging.

## Worked examples

These show what output looks like for three common cases. Follow the structure exactly.

### Example 1 — Short draft, spelling only (no engagement)

**Input draft:**
"আমি গতকাল ঢাকায় গিয়েছিলাম। সেখানে আমার বিষন্ন ভাইয়ের সাথে দেখা হল।"

**Output:**

```
--- CORRECTED DRAFT ---
আমি গতকাল ঢাকায় গিয়েছিলাম। সেখানে আমার বিষণ্ণ ভাইয়ের সঙ্গে দেখা হল।

--- CHANGES ---
1. বিষন্ন → বিষণ্ণ — spelling-confusions §ন/ণ: তৎসম বিষণ্ণ uses double ণ
2. সাথে → সঙ্গে — common-errors §6: Bangla Academy canonical form

--- NOTES ---
Standard: Bangla Academy · Words corrected: 2 · Punctuation: 0 · Needs verification: 0
```

Note: সাথে vs সঙ্গে is a stylistic choice; both are accepted. The CHANGES entry above assumes the user prefers canonical form. If the user wants to keep their dialectal choice, drop that change.

---

### Example 2 — Long draft with engagement opt-in

**User prompt:** "Please proofread this draft and suggest more engaging patterns."

**Input draft (excerpt):**
"আজ আমি একটি বিষয় নিয়ে কথা বলতে চাই। React ভালো। React জনপ্রিয়। React দ্রুত।"

**Output:**

```
--- CORRECTED DRAFT ---
আজ আমি একটি বিষয় নিয়ে কথা বলতে চাই। React ভালো। React জনপ্রিয়। React দ্রুত।

--- CHANGES ---
(none)

--- SUGGESTIONS ---
SUGGESTION: "আজ আমি একটি বিষয় নিয়ে কথা বলতে চাই।"
→ "আজকের পোস্টে একটি ভুল ধরিয়ে দিতে চাই।"
Why: The second version names the hook instead of announcing the topic abstractly.

SUGGESTION: "React ভালো। React জনপ্রিয়। React দ্রুত।"
→ "React ভালো, জনপ্রিয়, এবং দ্রুত — তিনটিই একসাথে।"
Why: Combines three flat short sentences into one that builds momentum.

--- NOTES ---
Standard: Bangla Academy · Words corrected: 0 · Punctuation: 0 ·
Suggestions: 2 · Needs verification: 0
```

Note: The SUGGESTIONS block is only emitted because the user explicitly asked for engagement improvements. The CORRECTED DRAFT preserves the user's voice exactly — engagement suggestions appear in SUGGESTIONS, not in the corrected text.

---

### Example 3 — Draft with one needs verification flag

**Input draft:**
"এই ফিচারটি অত্যান্ত গুরুত্বপূর্ণ।"

**Output:**

```
--- CORRECTED DRAFT ---
এই ফিচারটি অত্যান্ত গুরুত্বপূর্ণ।

--- CHANGES ---
(none)

--- NOTES ---
Standard: Bangla Academy · Words corrected: 0 · Punctuation: 0 ·
Needs verification: 1
- অত্যান্ত: not in references; common spelling অত্যন্ত but অত্যান্ত may also occur. Flagged for user verification.
```

Note: `needs verification` appears in NOTES, not in CHANGES. The CORRECTED DRAFT preserves the original spelling exactly. The model does not silently "correct" to অত্যন্ত when uncertain.

---

## Limitations

- The skill relies on the model's existing Bengali knowledge plus the references. Where the model genuinely does not know, it must say `needs verification` — never invent.
- The references are written from canonical Bangla Academy rules. They can be enriched with web-fetched material from authoritative Bengali-language sites when reachable.
- The skill does not connect to a Bengali spell-checker like BengaliHunspell or Rajbhasha. Adding that would be a separate tool, not a skill.
- Engagement suggestions are inherently subjective. The bar is high; only flag clearly flat or repetitive sentences.