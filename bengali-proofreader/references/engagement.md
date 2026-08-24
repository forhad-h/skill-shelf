# Engagement suggestions — opt-in only

Engagement suggestions are sentence-level rephrasings that improve clarity, flow, or impact. They are **opt-in**: the user must explicitly request them in their prompt (e.g. "suggest more engaging patterns", "improve flow", "make it more readable").

**This skill is a proofreader, not a writer.** Engagement suggestions are an optional add-on, not the default. When the user has not asked, skip Step 3 entirely and omit the `--- SUGGESTIONS ---` block from the output.

---

## When to suggest

Engagement suggestions are appropriate when:

1. **A sentence is flat or formulaic** — uses a clichéd opener, a passive construction where active would land better, or a structure that buries the point.
2. **A pattern is repeated unnecessarily** — the same sentence shape three times in a paragraph, the same transition word used back-to-back.
3. **A phrase is wordy** — could be tightened without losing meaning or voice.
4. **A key sentence lacks impact** — the reader's attention drops at this point.

## When NOT to suggest

Do **not** suggest a rewrite when:

1. **The user is reporting facts** — even if a fact sentence reads "flat", rewriting it changes the user's claim. Leave alone.
2. **The sentence contains a technical term** — the user chose the wording for precision. Suggesting a softer synonym may dilute meaning.
3. **The sentence is in dialectal register** — করতেছি, এস, আছ are valid. Never rewrite dialect.
4. **The sentence is in formal/literary register** — even if it reads stiff to modern ears, the user chose this register.
5. **The change would alter the user's voice** — if the suggestion sounds like a different author wrote it, it's out of scope.
6. **The sentence is short and direct** — terse is a valid style. Don't pad it.
7. **The user already has a strong voice** — match the user's energy, don't impose a "better" version.

---

## The bar

Engagement suggestions are **inherently subjective**. The bar is high:

- **Suggest at most 1-3 sentences per draft.** If you find yourself flagging every paragraph, you're over-suggesting.
- **Only flag clearly flat or repetitive sentences.** If the sentence is acceptable as-is, leave it.
- **Mark every one as `SUGGESTION:`** — never present a rewrite as a correction.
- **Be polite.** "Consider rephrasing" not "this is wrong".
- **Provide a reason.** Why does this version read better? What does the user gain?

---

## Format for SUGGESTIONS entries

Each suggestion follows this shape:

```
SUGGESTION: "<original sentence>"
→ "<suggested rephrase>"
Why: <one-line reason>
```

Example:

```
SUGGESTION: "এই সমস্যাটি অনেক বড়।"
→ "এই সমস্যাটি আমাদের সবার পরিচিত।"
Why: Moves from abstract ("very big") to concrete ("familiar to all of us"), which lands better with a tech audience.
```

---

## Examples of good suggestions

**Good (flat opener flagged):**

Original: "আজ আমি একটি বিষয় নিয়ে কথা বলতে চাই।"
Suggested: "আজকের পোস্টে একটি ভুল ধরিয়ে দিতে চাই।"
Why: The second version names the hook ("ভুল ধরিয়ে দেওয়া") instead of announcing the topic abstractly.

**Good (repetition flagged):**

Original: "React ভালো। React জনপ্রিয়। React দ্রুত।"
Suggested: "React ভালো, জনপ্রিয়, এবং দ্রুত — তিনটিই একসাথে।"
Why: Combines three flat short sentences into one that builds momentum.

**Good (wordy phrase flagged):**

Original: "আমি মনে করি যে এটি করা উচিত।"
Suggested: "এটি করা উচিত।"
Why: Drops the filler ("আমি মনে করি যে") — the direct version carries the same weight.

---

## Examples of bad suggestions (do NOT make these)

**Bad (factual content):**

Original: "React 2013 সালে Facebook-এ তৈরি হয়েছিল।"
Suggested: "React Facebook-এর একটি জনপ্রিয় লাইব্রেরি।"
Why bad: The second version drops the year 2013. Fact-rewriting is out of scope.

**Bad (voice-altering):**

Original: "করতেছি এখন কাজ, পরে লিখব।"
Suggested: "আমি এখন কাজ করছি, পরে লিখব।"
Why bad: The user is in a regional/dialectal register. Rewriting to standard formal changes their voice.

**Bad (over-suggesting):**

Flagging 8 sentences in a 5-paragraph draft. The bar is high. Stop after 1-3.

**Bad (presenting as a correction):**

"Fix: 'আমি মনে করি যে এটি করা উচিত' → 'এটি করা উচিত'"
Why bad: Engagement rewrites are not corrections. Always mark as `SUGGESTION:`.

---

## Self-check questions

Before emitting a SUGGESTION, ask:

1. **Is this sentence genuinely flat or repetitive?** Or am I imposing my own style preference?
2. **Does the rewrite preserve the user's voice?** Read both aloud. Do they sound like the same author?
3. **Does the rewrite change any facts?** If yes, drop the suggestion.
4. **Would the user likely agree?** If the rewrite feels like a stretch, leave the original alone.
5. **Am I over-suggesting?** If I've already flagged 3 sentences, stop.

If the answer to any of these is "no" or "unsure", leave the sentence alone.

---

## What this skill does NOT do

- It does not suggest engagement rewrites unless the user asked.
- It does not flag every flat sentence — only the clearly weak ones.
- It does not rewrite dialectal or formal registers.
- It does not present engagement suggestions as corrections.
- It does not change facts, technical terms, or proper nouns.
- It does not suggest more than 1-3 rewrites per draft.
